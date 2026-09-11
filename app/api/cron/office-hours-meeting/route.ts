import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  ensureOfficeHoursMeeting,
  ensureZoomRegistrants,
  onePmEasternToUTC,
  STANDING_ATTENDEES,
} from "@/lib/zoom";
import { activeMemberContacts } from "@/lib/commerce/entitlements";
import { sendOwnerAlert } from "@/lib/commerce/email";

// Alex hosts these (the S2S app creates them under his own Zoom account via
// /users/me/meetings) but a host is never a registrant of their own meeting
// by default, so he never got the registrant confirmation email Zoom sends
// on registration — the one with the "Add to Calendar" links. Confirmed live
// 2026-08-31 that Zoom's registrants API accepts the host's own email (201,
// not the "can't register with host email" rejection some Zoom setups
// report) — so registering him alongside real attendees is enough to get him
// a calendar invite too, no separate .ics generation needed.
const OWNER_EMAIL = "info@alexcoulombepresents.com";

// Creates the week's Friday office-hours Zoom meeting (fresh each week —
// Alex's call, 2026-08-12) so /api/admin/credits can auto-register members
// who redeem a credit for it. Runs daily in the same slot as the site's
// other crons rather than once on Fridays: ensureOfficeHoursMeeting is
// idempotent per-date, so the extra runs are cheap no-ops, and a daily
// schedule means a single failed run self-heals the next morning instead of
// silently leaving a whole week with no meeting.

export const maxDuration = 30;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No ZOOM_* configured is a deliberate no-op, not an error — it's the
  // same "feature not wired yet" state the rest of the Zoom integration
  // degrades to (see .env.example).
  if (!process.env.ZOOM_CLIENT_ID) {
    return NextResponse.json({ ok: true, skipped: "no ZOOM_CLIENT_ID configured" });
  }

  try {
    const result = await ensureOfficeHoursMeeting();
    if (result.created) {
      console.log(
        `[office-hours-meeting] created ${result.dateISO} → meeting ${result.meetingId} (${result.joinUrl})`
      );
      // Alex can't be a registrant on his own meeting (Zoom rejects the host
      // account, code 3027), so the only notice he ever got was Zoom's
      // confirmation to info@ — a mailbox he doesn't watch, which is why he
      // had no invite for his own 2026-09-11 session. Mail him the details
      // directly, at the address he actually reads.
      try {
        const startsAt = new Date(onePmEasternToUTC(result.dateISO));
        await sendOwnerAlert({
          subject: `Office hours ${result.dateISO} — your Zoom link`,
          body: [
            `This week's office hours is scheduled:`,
            "",
            `  ${startsAt.toLocaleString("en-US", {
              timeZone: "America/New_York",
              dateStyle: "full",
              timeStyle: "short",
            })} Eastern (2 hours)`,
            "",
            `Start it here: ${result.joinUrl}`,
            "",
            `Members are registered automatically by this cron and get their own`,
            `Zoom confirmation. Registration link for anyone else:`,
            `${result.registrationUrl ?? "(none)"}`,
            "",
            `Meeting ID: ${result.meetingId}`,
          ].join("\n"),
        });
      } catch (err) {
        console.error("[office-hours-meeting] owner notice failed", err);
      }
    }

    // Invite Alex, the TA, and every active member — every run, not just the
    // one that creates the meeting. Members were never invited by any code
    // path before (only a one-off script Alex ran by hand on 2026-09-04), so
    // a week nobody remembered to run it was a week nobody was invited.
    // ensureZoomRegistrants skips anyone Zoom already has, which is what
    // makes a daily re-run safe: Zoom re-sends its confirmation on every
    // successful registration, so registering blind would mail the same
    // invite to every member every morning. Running daily rather than once
    // also means someone who joins mid-week is invited the next day.
    let invites: Awaited<ReturnType<typeof ensureZoomRegistrants>> | null = null;
    try {
      const members = await activeMemberContacts();
      invites = await ensureZoomRegistrants(result.meetingId, [
        { email: OWNER_EMAIL, name: "Alex Coulombe" },
        ...STANDING_ATTENDEES,
        ...members,
      ]);
      if (invites.registered.length) {
        console.log(`[office-hours-meeting] invited ${invites.registered.join(", ")}`);
      }
      if (invites.failed.length) {
        console.error(`[office-hours-meeting] invite FAILED for ${invites.failed.join(", ")}`);
      }
    } catch (err) {
      // Never fail the whole cron over invites — the meeting itself exists,
      // and the next daily run retries from Zoom's own registrant list.
      console.error("[office-hours-meeting] invite sweep failed", err);
    }

    return NextResponse.json({
      ok: true,
      date: result.dateISO,
      meetingId: result.meetingId,
      created: result.created,
      // Only present on the run that actually created it — Alex needs the
      // join URL, and the registration URL is what non-member drop-in
      // buyers get pointed at.
      joinUrl: result.joinUrl,
      registrationUrl: result.registrationUrl,
      invites,
    });
  } catch (err) {
    console.error("[office-hours-meeting] failed", err);
    return NextResponse.json({ ok: false, error: "office hours meeting creation failed" }, { status: 500 });
  }
}
