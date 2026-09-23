import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { wednesdayCalendar } from "@/lib/store";
import { ensureZoomRegistrants, STANDING_ATTENDEES, OWNER_INVITE_CONTACTS } from "@/lib/zoom";
import { activeMemberContacts } from "@/lib/commerce/entitlements";

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
// cron existed — self-heals his invite too, not just members'.

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

  const now = new Date();
  const results: { slug: string; action: string }[] = [];

  let members: { email: string; name: string | null }[];
  try {
    members = await activeMemberContacts();
  } catch (err) {
    console.error("[class-member-invites] active member lookup failed", err);
    return NextResponse.json({ ok: false, error: "active member lookup failed" }, { status: 500 });
  }

  for (const item of wednesdayCalendar) {
    if (!item.zoomMeetingId || !item.sessionDateISO) {
      results.push({ slug: item.slug, action: "no-meeting" });
      continue;
    }
    if (new Date(item.sessionDateISO) <= now) {
      results.push({ slug: item.slug, action: "past" });
      continue;
    }
    try {
      const invites = await ensureZoomRegistrants(item.zoomMeetingId, [
        ...OWNER_INVITE_CONTACTS,
        ...STANDING_ATTENDEES,
        ...members,
      ]);
      if (invites.failed.length) {
        console.error(`[class-member-invites] invite FAILED for ${item.slug}: ${invites.failed.join(", ")}`);
      }
      results.push({
        slug: item.slug,
        action: `registered ${invites.registered.length}, skipped ${invites.skipped.length}, failed ${invites.failed.length}`,
      });
    } catch (err) {
      console.error(`[class-member-invites] invite sweep failed for ${item.slug}`, err);
      results.push({ slug: item.slug, action: "sweep-error" });
    }
  }

  return NextResponse.json({ ok: true, results });
}
