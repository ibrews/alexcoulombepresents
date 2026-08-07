// ── Telegram bot helper — @alexctraining tip approval flow ──────────────────
// Reuses the fleet's existing bot (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID) to
// send draft tips with an inline Approve/Reject keyboard. The webhook route
// (app/api/telegram/webhook) handles the button taps.

const API_BASE = "https://api.telegram.org";

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

function chatId(): string {
  const id = process.env.TELEGRAM_CHAT_ID;
  if (!id) throw new Error("TELEGRAM_CHAT_ID is not set");
  return id;
}

type InlineKeyboardButton = { text: string; callback_data: string };

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(json)}`);
  }
  return json.result;
}

// Sends a draft tip for approval. Returns the Telegram message_id so the
// caller can store it on the queue row (needed to correlate the eventual
// button tap back to this specific draft).
export async function sendTipForApproval(input: {
  text: string;
  source?: string | null;
  queueId: number;
}): Promise<number> {
  const caption = [
    `📝 UE tip draft #${input.queueId} (${input.text.length}/280 chars)`,
    "",
    input.text,
    input.source ? `\nSource: ${input.source}` : "",
  ]
    .join("\n")
    .trim();

  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: "✅ Approve", callback_data: `approve:${input.queueId}` },
      { text: "❌ Reject", callback_data: `reject:${input.queueId}` },
    ],
  ];

  const result = await call("sendMessage", {
    chat_id: chatId(),
    text: caption,
    reply_markup: { inline_keyboard: keyboard },
  });
  return result.message_id as number;
}

// Called after a decision — strips the buttons and marks the outcome inline
// so old messages in the chat clearly show what happened, without needing a
// separate confirmation message.
export async function markTipDecided(messageId: number, originalText: string, decision: "approved" | "rejected") {
  const marker = decision === "approved" ? "✅ APPROVED" : "❌ REJECTED";
  await call("editMessageText", {
    chat_id: chatId(),
    message_id: messageId,
    text: `${marker}\n\n${originalText}`,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

// Plain notification — used for failure alerts (empty queue, refresh
// failure, post failure) so a broken pipeline doesn't fail silently.
export async function sendTelegramAlert(text: string) {
  await call("sendMessage", { chat_id: chatId(), text: `⚠️ ${text}` });
}

// Plain informational notification, no ⚠️ prefix — for routine good-news
// pings (a class signup) that shouldn't read as an alert.
export async function sendTelegramNotice(text: string) {
  await call("sendMessage", { chat_id: chatId(), text });
}

// The Wednesday-calendar equivalent of sendTipForApproval — sent by the
// class-checkin cron (app/api/cron/class-checkin) the Tuesday before a class
// that's under its minEnrollment. app/api/telegram/webhook handles the tap.
export async function sendClassCheckinPrompt(input: {
  slug: string;
  name: string;
  sessionDateLabel: string;
  seatsSold: number;
  minEnrollment: number;
}): Promise<number> {
  const text = [
    `🪑 "${input.name}" (${input.sessionDateLabel}) has ${input.seatsSold} of ${input.minEnrollment} minimum signed up.`,
    "",
    "Still want to teach it tomorrow?",
  ].join("\n");

  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: "✅ Yes, teach it", callback_data: `class-yes:${input.slug}` },
      { text: "❌ No, cancel it", callback_data: `class-no:${input.slug}` },
    ],
  ];

  const result = await call("sendMessage", {
    chat_id: chatId(),
    text,
    reply_markup: { inline_keyboard: keyboard },
  });
  return result.message_id as number;
}

export async function markClassCheckinDecided(
  messageId: number,
  originalText: string,
  decision: "confirmed" | "cancelled"
) {
  const marker = decision === "confirmed" ? "✅ TEACHING IT" : "❌ CANCELLED";
  await call("editMessageText", {
    chat_id: chatId(),
    message_id: messageId,
    text: `${marker}\n\n${originalText}`,
  });
}
