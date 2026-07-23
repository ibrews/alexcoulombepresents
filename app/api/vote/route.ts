import { NextRequest, NextResponse } from "next/server";
import { recordVote, getVoteCounts, getVoteTotalVoters, recordSignup } from "@/lib/db";
import { isVoteTopic, MAX_TOPICS_PER_VOTE, VOTE_TOPICS } from "@/lib/vote";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`vote:${clientIp(req)}`, 10, 60))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { email, topics, subscribe, honeypot, human } = body;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught.
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (
      !Array.isArray(topics) ||
      topics.length === 0 ||
      topics.length > MAX_TOPICS_PER_VOTE ||
      !topics.every(isVoteTopic)
    ) {
      return NextResponse.json(
        { error: `Pick 1–${MAX_TOPICS_PER_VOTE} topics from the list.` },
        { status: 400 }
      );
    }

    const subscribed = Boolean(subscribe);

    await recordVote({ email, topics, subscribed });

    // Opting in to announcements piggybacks on the site's existing signup
    // storage/notification path, filed under the "unreal" list.
    if (subscribed) {
      try {
        await recordSignup({ email, message: `Voted: ${topics.join(", ")}`, list: "unreal" });
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

export async function GET() {
  try {
    const [counts, total] = await Promise.all([getVoteCounts(), getVoteTotalVoters()]);
    return NextResponse.json({ ok: true, counts, total, topics: VOTE_TOPICS });
  } catch (err) {
    console.error("Vote GET error:", err);
    return NextResponse.json({ error: "Couldn't load results." }, { status: 500 });
  }
}
