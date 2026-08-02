import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getNextApprovedUnpostedTip, markTipPosted, wasAlreadyPostedToday, countPendingApproval } from "@/lib/db";
import { postTweet, X_ACCOUNT } from "@/lib/xApi";
import { sendTelegramAlert } from "@/lib/telegram";

// Daily #uetips poster for @alexctraining. Fires HOURLY (see vercel.json) —
// timezone-proof against DST by checking the actual Eastern wall-clock hour
// on every invocation instead of hardcoding a UTC cron time that would drift
// an hour twice a year. Only acts during the 10am ET hour, and only once per
// day (wasAlreadyPostedToday guards a stray double-fire in the same hour).
//
// Content is pre-vetted: this route never generates or judges a tip, it only
// posts whatever's already sitting in ue_tip_queue with status='approved' —
// see intelligence/decisions/2026-08-02-uetips-content-verification-required.md
// for why unattended posting must never skip that human approval step.

export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function currentEasternHour(): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return parseInt(formatted, 10) % 24;
}

function todayEasternDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?force=1 bypasses the hour/once-per-day gates for manual testing — still
  // requires CRON_SECRET, so this isn't a public trigger.
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (!force && currentEasternHour() !== 10) {
    return NextResponse.json({ skipped: "not the 10am ET hour" });
  }

  const today = todayEasternDate();
  if (!force && (await wasAlreadyPostedToday(X_ACCOUNT, today))) {
    return NextResponse.json({ skipped: "already posted today" });
  }

  const tip = await getNextApprovedUnpostedTip(X_ACCOUNT);
  if (!tip) {
    const pending = await countPendingApproval(X_ACCOUNT);
    const msg =
      pending > 0
        ? `#uetips queue is empty of APPROVED drafts — ${pending} still waiting on your Telegram approval.`
        : `#uetips queue is completely empty — no drafts pending approval either. Nothing to post today.`;
    await sendTelegramAlert(msg);
    return NextResponse.json({ skipped: "no approved tip available", pendingApproval: pending });
  }

  try {
    const result = await postTweet(tip.text);
    await markTipPosted(tip.id, result.id);
    return NextResponse.json({ posted: true, tweetId: result.id, tipId: tip.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendTelegramAlert(`#uetips post FAILED for draft #${tip.id}: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
