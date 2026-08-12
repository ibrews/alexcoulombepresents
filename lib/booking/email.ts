// ── Booking — transactional email ──────────────────────────────────────────
// Every send BCCs the owner (same rule as the membership welcome), so "did
// this actually go out?" is answerable from his own inbox.

import { Resend } from "resend";
import { formatSlot } from "./availability";
import {
  BOOKING_TIMEZONE,
  HOLD_HOURS,
  bookingActionSignature,
  rateById,
  bookingHours,
  type BookingRow,
} from "./config";

const OWNER_EMAIL = "info@alexcoulombepresents.com";
const FROM = "Alex Coulombe Presents <info@alexcoulombepresents.com>";

function brandedHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linkify = (s: string) =>
    s.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#0d9488;">$1</a>');
  const paras = text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;white-space:pre-line;">${linkify(esc(p))}</p>`)
    .join("");
  return [
    '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:24px;background:#f6f6fa;">',
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px;',
    "font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#292524;",
    'border-top:4px solid #2dd4bf;">',
    paras,
    '<hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0 20px;">',
    '<a href="https://www.alexcoulombepresents.com" style="text-decoration:none;">',
    '<img src="https://www.alexcoulombepresents.com/logo-email.png" width="150" alt="Alex Coulombe Presents" style="display:block;border:0;">',
    "</a></div></body></html>",
  ].join("");
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alexcoulombepresents.com";
}

/** "2 hours" — derived from the row via the shared bookingHours(), never
 * assumed. These emails were written when every booking was exactly an hour
 * and said so literally, which would have told a 3-hour client they'd
 * booked one. */
function lengthLabel(booking: BookingRow): string {
  const hours = bookingHours(booking.slot_start, booking.slot_end);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** Requester's acknowledgement — deliberately does NOT promise the slot. */
export async function sendBookingRequestAck(booking: BookingRow): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);
  const body = [
    `Hi ${booking.name.split(" ")[0]} — got your request.`,
    "",
    `  ${when} — ${lengthLabel(booking)}`,
    "",
    "Nothing is booked yet and you haven't been charged. Alex reviews these himself,",
    "usually within a day. If it works, you'll get an email with a payment link and the",
    "slot is yours once that's paid. If it doesn't, he'll say so and suggest another time.",
    "",
    "Reply to this email if anything changes on your end.",
    "",
    "— Alex Coulombe Presents",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: FROM,
    to: booking.email,
    bcc: OWNER_EMAIL,
    replyTo: OWNER_EMAIL,
    subject: `Request received: ${when}`,
    text: body,
    html: brandedHtml(body),
  });
  if (error) throw new Error(`booking ack failed: ${error.message}`);
}

/** Owner alert carrying the one-click confirm/decline links. */
export async function sendBookingOwnerRequest(booking: BookingRow): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);
  const confirm = `${siteUrl()}/api/book/action?token=${booking.token}&action=confirm&sig=${bookingActionSignature(booking.token, "confirm")}`;
  const decline = `${siteUrl()}/api/book/action?token=${booking.token}&action=decline&sig=${bookingActionSignature(booking.token, "decline")}`;
  const confirmStandard = `${siteUrl()}/api/book/action?token=${booking.token}&action=confirm_standard&sig=${bookingActionSignature(booking.token, "confirm_standard")}`;
  const rate = rateById(booking.rate);
  const reduced = booking.rate !== "standard";
  const body = [
    `${booking.name} <${booking.email}> wants:`,
    "",
    `  ${when} — ${lengthLabel(booking)}`,
    "",
    booking.note ? `They said: ${booking.note}` : "(no note)",
    "",
    `Rate claimed: ${rate?.label ?? booking.rate}` +
      (reduced ? " — self-declared, not verified" : ""),
    `Price if you confirm: $${(booking.price_cents / 100).toFixed(0)}`,
    "",
    `Confirm at that price (holds it ${HOLD_HOURS}h and emails them a payment link):`,
    confirm,
    ...(reduced
      ? [
          "",
          "Confirm at the STANDARD price instead (same hold, full rate):",
          confirmStandard,
        ]
      : []),
    "",
    "Decline (frees the slot and lets them know):",
    decline,
    "",
    "They have NOT been charged. Nothing is collected until you confirm.",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: FROM,
    to: OWNER_EMAIL,
    replyTo: booking.email,
    subject: `Booking request: ${booking.name} — ${when}${reduced ? " (reduced rate claimed)" : ""}`,
    text: body,
    html: brandedHtml(body),
  });
  if (error) console.error("booking owner alert failed:", error.message);
}

/** Sent on confirm — this is the one that asks for money. */
export async function sendBookingConfirmedEmail(booking: BookingRow): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);
  // Points at our own page, never a Stripe Checkout URL: sessions expire in
  // 24h and this email may well be opened later than that. /book/pay/<token>
  // mints a fresh session on click.
  const payUrl = `${siteUrl()}/book/pay/${booking.token}`;
  const body = [
    `Hi ${booking.name.split(" ")[0]} — that time works. It's held for you:`,
    "",
    `  ${when}`,
    "",
    `Pay here to lock it in — $${(booking.price_cents / 100).toFixed(0)} for ${lengthLabel(booking)}:`,
    payUrl,
    "",
    `The hold lasts ${HOLD_HOURS} hours. After that the slot goes back up for anyone,`,
    "so grab it when you get a moment. You'll get the video link by email as soon as",
    "payment goes through.",
    "",
    "— Alex Coulombe Presents",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: FROM,
    to: booking.email,
    bcc: OWNER_EMAIL,
    replyTo: OWNER_EMAIL,
    subject: `Confirmed — ${when} (payment link inside)`,
    text: body,
    html: brandedHtml(body),
  });
  if (error) throw new Error(`booking confirmation failed: ${error.message}`);
}

export async function sendBookingDeclinedEmail(booking: BookingRow): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);
  const body = [
    `Hi ${booking.name.split(" ")[0]} — sorry, ${when} won't work after all.`,
    "",
    "Nothing was charged. Other open times are here, and Alex would genuinely like to",
    "find one that fits:",
    `${siteUrl()}/book`,
    "",
    "Or just reply to this email and say roughly when suits you.",
    "",
    "— Alex Coulombe Presents",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: FROM,
    to: booking.email,
    bcc: OWNER_EMAIL,
    replyTo: OWNER_EMAIL,
    subject: `About ${when}`,
    text: body,
    html: brandedHtml(body),
  });
  if (error) throw new Error(`booking decline email failed: ${error.message}`);
}

/** Sent once payment clears. */
export async function sendBookingPaidEmail(booking: BookingRow, schedulingUrl?: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);
  const body = [
    `You're booked, ${booking.name.split(" ")[0]}.`,
    "",
    `  ${when} — ${lengthLabel(booking)}, one-on-one`,
    "",
    ...(schedulingUrl
      ? ["Alex will send the video link before then. If you need to move it, reply here.", ""]
      : ["Alex will email the video link before then. If you need to move it, just reply here.", ""]),
    "Come with whatever you want to dig into — a project review, a stuck pipeline,",
    "scoping a build, career questions. It's your hour.",
    "",
    "— Alex Coulombe Presents",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: FROM,
    to: booking.email,
    bcc: OWNER_EMAIL,
    replyTo: OWNER_EMAIL,
    subject: `Booked: ${when}`,
    text: body,
    html: brandedHtml(body),
  });
  if (error) throw new Error(`booking paid email failed: ${error.message}`);
}
