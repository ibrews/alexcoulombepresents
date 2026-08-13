import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { ensureOfficeHoursMeeting } from "@/lib/zoom";

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
    });
  } catch (err) {
    console.error("[office-hours-meeting] failed", err);
    return NextResponse.json({ ok: false, error: "office hours meeting creation failed" }, { status: 500 });
  }
}
