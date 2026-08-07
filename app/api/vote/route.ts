import { NextRequest, NextResponse } from "next/server";
import { recordVote, getVoteCounts, getVoteTotalVoters, recordSignup } from "@/lib/db";
import {
  isVoteTopic,
  isOtherTopic,
  otherTopicLabel,
  sanitizeOtherTopic,
  encodeOtherTopic,
  MAX_TOPICS_PER_VOTE,
  VOTE_TOPICS,
} from "@/lib/vote";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { memberTierForEmail, voteWeightForTier } from "@/lib/commerce/membership";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`vote:${clientIp(req)}`, 10, 60))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { topics, subscribe, honeypot, human } = body;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught.
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    // Email is optional — voting shouldn't require handing over an address.
    // It's used to weight the vote by membership tier and to opt in to
    // announcements; without it the vote just counts at the normal (1x)
    // weight and skips the announcements signup below.
    const email: string | null = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
    if (
      !Array.isArray(topics) ||
      topics.length === 0 ||
      topics.length > MAX_TOPICS_PER_VOTE ||
      !topics.every((t) => typeof t === "string" && (isVoteTopic(t) || isOtherTopic(t)))
    ) {
      return NextResponse.json(
        { error: `Pick 1–${MAX_TOPICS_PER_VOTE} topics from the list, or write in your own.` },
        { status: 400 }
      );
    }

    // Re-sanitize any write-in server-side — the client already does this,
    // but a crafted request shouldn't be trusted to have. A write-in that
    // sanitizes down to nothing (e.g. all whitespace) is dropped from the
    // vote rather than rejecting the whole submission, so a stray blank
    // Other field never blocks a vote that also picked a real topic.
    const cleanedTopics = topics
      .map((t: string) => {
        if (isVoteTopic(t)) return t;
        const sanitized = sanitizeOtherTopic(otherTopicLabel(t));
        return sanitized ? encodeOtherTopic(sanitized) : null;
      })
      .filter((t): t is string => t !== null);
    if (cleanedTopics.length === 0) {
      return NextResponse.json(
        { error: `Pick 1–${MAX_TOPICS_PER_VOTE} topics from the list, or write in your own.` },
        { status: 400 }
      );
    }

    // Anonymous votes (no email) can't be tied to a membership tier, so they
    // just get the normal 1x weight — same fallback as a lookup failure
    // (DB hiccup, unrecognized email) for a real one.
    const weight = email ? voteWeightForTier(await memberTierForEmail(email).catch(() => null)) : 1;

    await recordVote({ email, topics: cleanedTopics, subscribed: Boolean(subscribe), weight });

    // Opting in to announcements piggybacks on the site's existing signup
    // storage/notification path, filed under the "unreal" list — obviously
    // only possible with an actual address to send them to.
    if (subscribe && email) {
      try {
        await recordSignup({ email, message: `Voted: ${cleanedTopics.join(", ")}`, list: "unreal" });
      } catch (dbErr) {
        console.error("recordSignup (from vote) failed:", dbErr);
      }
    }

    const [counts, total] = await Promise.all([getVoteCounts(), getVoteTotalVoters()]);
    return NextResponse.json({ ok: true, counts, total, topics: VOTE_TOPICS });
  } catch (err) {
    console.error("Vote route error:", err);
    return NextResponse.json(
      { error: "Couldn't record your vote. Please email info@alexcoulombepresents.com." },
      { status: 500 }
    );
  }
}

// Read-only tallies are cross-origin readable so live surfaces off this domain — the
// class decks on ibrews.github.io, which display the poll on screen while the room votes
// — can render them. This is aggregate, already-public data (the same numbers /training
// shows anyone); no emails or per-voter rows are exposed here. Deliberately GET-only:
// POST stays same-origin so opening up the display path cannot open up ballot stuffing.
const READ_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: READ_CORS });
}

export async function GET() {
  try {
    const [counts, total] = await Promise.all([getVoteCounts(), getVoteTotalVoters()]);
    return NextResponse.json(
      { ok: true, counts, total, topics: VOTE_TOPICS },
      // A live display polls this repeatedly; caching it would freeze the on-screen
      // numbers mid-class exactly when they are supposed to be moving.
      { headers: { ...READ_CORS, "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Vote GET error:", err);
    return NextResponse.json(
      { error: "Couldn't load results." },
      { status: 500, headers: READ_CORS }
    );
  }
}
