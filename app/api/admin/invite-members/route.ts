import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { inviteMembersToUpcomingSessions } from "@/lib/memberInvites";

// Run the full member-invite sweep NOW: every paid-up member (+ Alex and the
// standing attendees) registered on every upcoming dated class and the current
// office hours. Run it right after adding new classes to wednesdayCalendar so
// members are invited immediately instead of at the next daily cron
// (decision 2026-10-02). Idempotent — Zoom's registrant list is diffed first.
//   POST /api/admin/invite-members?key=ADMIN_KEY
//   (or header  x-admin-key: ADMIN_KEY)
// Optional JSON body {"emails":["a@b.com"]} limits it to those members.

export const maxDuration = 60;

function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-admin-key");
  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.ZOOM_CLIENT_ID) {
    return NextResponse.json({ ok: true, skipped: "no ZOOM_CLIENT_ID configured", results: [] });
  }

  let emails: string[] | undefined;
  try {
    const body = await req.json();
    if (Array.isArray(body?.emails)) emails = body.emails.filter((e: unknown) => typeof e === "string");
  } catch {
    /* no/invalid body → full sweep */
  }

  try {
    const { ok, results } = await inviteMembersToUpcomingSessions(emails ? { onlyEmails: emails } : {});
    return NextResponse.json({ ok, results }, { status: ok ? 200 : 207 });
  } catch (err) {
    console.error("[admin/invite-members] failed", err);
    return NextResponse.json({ ok: false, error: "invite sweep failed" }, { status: 500 });
  }
}
