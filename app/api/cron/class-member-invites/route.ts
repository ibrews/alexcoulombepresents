import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { inviteMembersToUpcomingSessions } from "@/lib/memberInvites";

// Daily member-invite sweep for every upcoming dated Wednesday class —
// the class-calendar equivalent of app/api/cron/office-hours-meeting's
// member invite sweep. Office hours already invites every active member
// automatically; dated classes never did (confirmed missing 2026-09-23, when
// none of the 3 active members were registered for that day's Intro to AR
// class despite membership including class access). ensureZoomRegistrants
// skips anyone Zoom already has, so a daily re-run is safe: it doesn't
// re-mail people already registered, and someone who joins mid-week (or buys
// membership the same week as a class) is picked up the next morning. Also
// registers OWNER_INVITE_CONTACTS (Alex's two real inboxes, lib/zoom.ts) so
// a class created outside create-class-meeting.mjs — or created before this
// cron existed — self-heals his invite too, not just members'. The sweep
// itself lives in lib/memberInvites.ts, shared with the renewal webhook and
// POST /api/admin/invite-members (schedule-publish trigger); this cron is the
// safety net behind both. It now also covers the current office hours.

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

  if (!process.env.ZOOM_CLIENT_ID) {
    return NextResponse.json({ ok: true, skipped: "no ZOOM_CLIENT_ID configured" });
  }

  try {
    const { ok, results } = await inviteMembersToUpcomingSessions();
    return NextResponse.json({ ok, results });
  } catch (err) {
    console.error("[class-member-invites] active member lookup failed", err);
    return NextResponse.json({ ok: false, error: "active member lookup failed" }, { status: 500 });
  }
}
