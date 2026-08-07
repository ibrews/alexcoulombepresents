import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { wednesdayCalendar } from "@/lib/store";
import { getSeatsSold } from "@/lib/commerce/seats";
import { getCheckin, recordCheckinPrompt } from "@/lib/commerce/classCheckin";
import { sendClassCheckinPrompt, sendTelegramAlert } from "@/lib/telegram";

// Daily min-enrollment check-in for the Wednesday calendar (see vercel.json —
// fires at the same 14:00 UTC / 10am ET slot as the other daily crons). For
// each dated class, the one day this actually does anything is the Tuesday
// before it: if paid seats are still under item.minEnrollment, Alex gets a
// Telegram Yes/No prompt (app/api/telegram/webhook.ts handles the tap) —
// "no" triggers coupon+email to every buyer, see that route.

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

function isCheckinDue(sessionDateISO: string, now: Date): boolean {
  const session = new Date(sessionDateISO);
  const dayBefore = new Date(session.getTime() - 24 * 60 * 60 * 1000);
  return now >= dayBefore && now < session;
}

function formatSessionDateLabel(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" })
  );
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: { slug: string; action: string }[] = [];

  for (const item of wednesdayCalendar) {
    if (!item.sessionDateISO || item.minEnrollment === undefined) continue;
    if (!isCheckinDue(item.sessionDateISO, now)) {
      results.push({ slug: item.slug, action: "not-due" });
      continue;
    }

    const existing = await getCheckin(item.slug).catch(() => null);
    if (existing) {
      results.push({ slug: item.slug, action: `already-${existing.status}` });
      continue;
    }

    let seatsSold: number;
    try {
      seatsSold = await getSeatsSold(item.slug);
    } catch (err) {
      console.error(`[class-checkin] seat count failed for ${item.slug}`, err);
      results.push({ slug: item.slug, action: "seat-count-error" });
      continue;
    }

    if (seatsSold >= item.minEnrollment) {
      results.push({ slug: item.slug, action: `ok (${seatsSold}/${item.minEnrollment})` });
      continue;
    }

    try {
      const messageId = await sendClassCheckinPrompt({
        slug: item.slug,
        name: item.name,
        sessionDateLabel: formatSessionDateLabel(item.sessionDateISO),
        seatsSold,
        minEnrollment: item.minEnrollment,
      });
      await recordCheckinPrompt({ slug: item.slug, telegramMessageId: messageId, seatsAtPrompt: seatsSold });
      results.push({ slug: item.slug, action: `prompted (${seatsSold}/${item.minEnrollment})` });
    } catch (err) {
      console.error(`[class-checkin] prompt failed for ${item.slug}`, err);
      try {
        await sendTelegramAlert(`class-checkin prompt failed for ${item.slug} — check logs.`);
      } catch {
        // Nothing more to do if even the alert can't send.
      }
      results.push({ slug: item.slug, action: "prompt-error" });
    }
  }

  return NextResponse.json({ ok: true, results });
}
