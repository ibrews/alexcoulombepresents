import { NextRequest, NextResponse } from "next/server";
import { getTipByTelegramMessageId, decideTip } from "@/lib/db";
import { markTipDecided, answerCallbackQuery } from "@/lib/telegram";

// Handles taps on the Approve/Reject buttons sent by lib/telegram.ts's
// sendTipForApproval. Register once after deploy:
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

  const [action, idStr] = String(cb.data ?? "").split(":");
  const queueId = parseInt(idStr, 10);
  if ((action !== "approve" && action !== "reject") || Number.isNaN(queueId)) {
    await answerCallbackQuery(cb.id, "Bad button data");
    return NextResponse.json({ ok: true });
  }

  const decision = action === "approve" ? "approved" : "rejected";
  const tip = await decideTip(queueId, decision);
  if (!tip) {
    // Already decided (double tap, or stale button) — just ack, don't error.
    await answerCallbackQuery(cb.id, "Already decided");
    return NextResponse.json({ ok: true });
  }

  const messageId = cb.message?.message_id ?? tip.telegram_message_id;
  if (messageId) {
    await markTipDecided(messageId, tip.text, decision);
  }
  await answerCallbackQuery(cb.id, decision === "approved" ? "Approved ✅" : "Rejected ❌");

  return NextResponse.json({ ok: true });
}
