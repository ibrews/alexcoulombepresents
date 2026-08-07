import { NextRequest, NextResponse } from "next/server";
import { getTipByTelegramMessageId, decideTip } from "@/lib/db";
import { markTipDecided, answerCallbackQuery, markClassCheckinDecided } from "@/lib/telegram";
import { decideCheckin } from "@/lib/commerce/classCheckin";
import { getOrdersForSlug } from "@/lib/commerce/seats";
import { createCancellationCoupon } from "@/lib/commerce/vouchers";
import { sendClassCancelledEmail } from "@/lib/commerce/email";
import { wednesdayCalendar } from "@/lib/store";

// Handles taps on the Approve/Reject buttons sent by lib/telegram.ts's
// sendTipForApproval, AND the Yes/No buttons sent by sendClassCheckinPrompt
// (app/api/cron/class-checkin). Register once after deploy:
//   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
//     -d "url=https://alexcoulombepresents.com/api/telegram/webhook" \
//     -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"

function authorized(req: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;
  return req.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await req.json();
  const cb = update.callback_query;
  if (!cb) {
    // Not a button tap (e.g. a plain reply) — nothing for this route to do.
    return NextResponse.json({ ok: true });
  }

  // Only Alex's chat can decide tips, even though the webhook secret alone
  // already scopes this to our bot.
  const expectedChatId = process.env.TELEGRAM_CHAT_ID;
  if (String(cb.message?.chat?.id) !== expectedChatId) {
    await answerCallbackQuery(cb.id, "Not authorized");
    return NextResponse.json({ ok: true });
  }

  const [action, rest] = String(cb.data ?? "").split(":");

  // ── Class check-in (min-enrollment go/no-go) ──────────────────────────
  if (action === "class-yes" || action === "class-no") {
    const slug = rest;
    const decision = action === "class-yes" ? "confirmed" : "cancelled";
    const checkin = await decideCheckin(slug, decision);
    if (!checkin) {
      await answerCallbackQuery(cb.id, "Already decided");
      return NextResponse.json({ ok: true });
    }

    const messageId = cb.message?.message_id ?? checkin.telegram_message_id;
    const originalText: string = cb.message?.text ?? "";
    if (messageId) {
      await markClassCheckinDecided(messageId, originalText, decision);
    }
    await answerCallbackQuery(cb.id, decision === "confirmed" ? "Teaching it ✅" : "Cancelled ❌");

    if (decision === "cancelled") {
      const item = wednesdayCalendar.find((i) => i.slug === slug);
      const orders = await getOrdersForSlug(slug).catch(() => []);
      // Best-effort per buyer — one failed email/coupon must not block the
      // rest of the class roster from getting theirs.
      for (const order of orders) {
        if (!order.email || order.amount_cents === null) continue;
        try {
          const amountOffCents = Math.round(order.amount_cents * 1.1);
          const couponCode = await createCancellationCoupon({
            classSlug: slug,
            buyerEmail: order.email,
            stripeSessionId: order.stripe_session_id,
            amountOffCents,
          });
          await sendClassCancelledEmail({
            email: order.email,
            name: order.name ?? undefined,
            className: item?.name ?? slug,
            amountPaidCents: order.amount_cents,
            couponCode,
            couponValueCents: amountOffCents,
          });
        } catch (err) {
          console.error(`[class-checkin] cancellation notice failed for ${order.email}`, err);
        }
      }
    }
    return NextResponse.json({ ok: true });
  }

  // ── #uetips draft approval ─────────────────────────────────────────────
  const queueId = parseInt(rest, 10);
  if ((action !== "approve" && action !== "reject") || Number.isNaN(queueId)) {
    await answerCallbackQuery(cb.id, "Bad button data");
    return NextResponse.json({ ok: true });
  }

  const tipDecision = action === "approve" ? "approved" : "rejected";
  const tip = await decideTip(queueId, tipDecision);
  if (!tip) {
    // Already decided (double tap, or stale button) — just ack, don't error.
    await answerCallbackQuery(cb.id, "Already decided");
    return NextResponse.json({ ok: true });
  }

  const messageId = cb.message?.message_id ?? tip.telegram_message_id;
  if (messageId) {
    await markTipDecided(messageId, tip.text, tipDecision);
  }
  await answerCallbackQuery(cb.id, tipDecision === "approved" ? "Approved ✅" : "Rejected ❌");

  return NextResponse.json({ ok: true });
}
