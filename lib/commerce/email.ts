// ── Commerce core — fulfillment email ───────────────────────────────────────

import { Resend } from "resend";
import { findDigitalProduct } from "./products";

// Renders our plain-text email bodies as simple branded HTML: white card,
// auto-linked URLs, and the ACP logo in the footer. Every sender passes the
// same string as both `text` (fallback) and `html` via this helper, so the
// two can never drift.
function brandedHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linkify = (s: string) =>
    s.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#0d9488;">$1</a>');
  const paras = text
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;white-space:pre-line;">${linkify(esc(p))}</p>`)
    .join("");
  return [
    // Explicit charset — some clients (older Outlook/Windows Mail) sniff the
    // HTML's own declaration rather than trusting the MIME Content-Type
    // header, and without this the em-dashes/bullets below render as mojibake.
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

export async function sendFulfillmentEmail(input: {
  email: string;
  sku: string;
  licenseKey: string;
  magicLinkUrl: string;
}) {
  const product = findDigitalProduct(input.sku);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

  const __body = [
      `Thanks for buying ${product?.name ?? input.sku}!`,
      "",
      `Your license key:`,
      input.licenseKey,
      "",
      `Access your download and account here (link expires in 30 minutes):`,
      input.magicLinkUrl,
      "",
      `If that link expires, request a new one any time at ${siteUrl}/account.`,
      "",
      `Questions? Reply to this email or write info@alexcoulombepresents.com.`,
    ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    subject: `Your ${product?.name ?? input.sku} license + download`,
    text: __body,
    html: brandedHtml(__body),
  });

  if (error) {
    console.error("Resend fulfillment email error:", error);
    throw new Error("Failed to send fulfillment email");
  }
}

export async function sendMagicLinkEmail(input: { email: string; magicLinkUrl: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const __body = [
      "Here's your sign-in link (expires in 30 minutes):",
      "",
      input.magicLinkUrl,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    subject: "Your Alex Coulombe Presents account link",
    text: __body,
    html: brandedHtml(__body),
  });
  if (error) {
    console.error("Resend magic-link email error:", error);
    throw new Error("Failed to send magic-link email");
  }
}

export async function sendDonationNotification(input: {
  amountCents: number;
  email?: string;
  name?: string;
  comment?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dollars = (input.amountCents / 100).toFixed(2);
  const __body = [
      `Amount: $${dollars}`,
      `From: ${input.name ?? "—"} <${input.email ?? "—"}>`,
      "",
      "Comment / request:",
      input.comment?.trim() || "(none)",
    ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    subject: `Lab donation: $${dollars} from ${input.name ?? input.email ?? "someone"}`,
    text: __body,
    html: brandedHtml(__body),
  });
  if (error) throw new Error(`donation notification failed: ${error.message}`);
}

// Buyer confirmation + owner fulfillment alert for the manual-fulfillment
// catalog (lib/store.ts). The buyer email doubles as the artifact for
// email-manual items (e.g. the class voucher: "this email is your receipt —
// reply to redeem"), so it must not silently fail: callers should let errors
// propagate so the Stripe webhook returns 500 and the event is retried.
export async function sendOrderEmails(input: {
  email: string;
  name?: string;
  itemName: string;
  itemDelivery: string;
  slug: string;
  amountCents: number;
  sessionId: string;
  // Only set for dated Wednesday-calendar items (lib/store.ts). When present
  // and seatsSold is still under minEnrollment, the buyer email gets an
  // under-minimum warning + a one-tap share link — the same coupon/refund
  // policy the class-checkin cron actually enforces the Tuesday before
  // (see app/api/telegram/webhook.ts), stated up front instead of as a
  // surprise if the class doesn't fill.
  seatsSold?: number;
  minEnrollment?: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dollars = (input.amountCents / 100).toFixed(2);
  const first = input.name?.split(" ")[0];

  const underMinimum =
    input.seatsSold !== undefined && input.minEnrollment !== undefined && input.seatsSold < input.minEnrollment;

  const shareText = `I just signed up to learn "${input.itemName}" with @alexctraining — join me!`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(
    "https://www.alexcoulombepresents.com/training#calendar"
  )}`;

  const underMinimumNote = underMinimum
    ? [
        "",
        `NOTE: only ${input.seatsSold} of the ${input.minEnrollment} minimum have signed up for this one so far, ` +
          "so it's possible it may not be taught. If that happens, you'll get a coupon worth 110% of what you paid " +
          "(good toward any future class) or a full refund — your choice, no back-and-forth needed.",
        "",
        "Spread the word to your friends to get them to sign up too — one tap:",
        shareUrl,
      ]
    : [];

  const __body = [
      `${first ? `Hey ${first}` : "Hey"} — thanks! Your order is confirmed.`,
      "",
      `  ${input.itemName} — $${dollars}`,
      "",
      `What happens next: ${input.itemDelivery}`,
      ...underMinimumNote,
      "",
      "Just reply to this email for anything — booking, questions, scheduling.",
      "It goes straight to Alex.",
      "",
      "— Alex Coulombe Presents",
      "https://www.alexcoulombepresents.com",
    ].join("\n");
  const buyer = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    replyTo: "info@alexcoulombepresents.com",
    subject: `Order confirmed: ${input.itemName}`,
    text: __body,
    html: brandedHtml(__body),
  });
  if (buyer.error) throw new Error(`buyer confirmation failed: ${buyer.error.message}`);

  const __ownerBody = [
      `Item: ${input.itemName} (${input.slug})`,
      `Buyer: ${input.name ?? "—"} <${input.email}>`,
      `Amount: $${dollars}`,
      `Stripe session: ${input.sessionId}`,
      "",
      "Buyer got the confirmation email; complete the manual fulfillment",
      "(voucher code / booking link / scheduling) by replying to them.",
    ].join("\n");
  const owner = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    subject: `FULFILL: ${input.itemName} — $${dollars} from ${input.name ?? input.email}`,
    text: __ownerBody,
    html: brandedHtml(__ownerBody),
  });
  if (owner.error) console.error("owner fulfillment alert failed:", owner.error.message);
}

// Fires once per member — the first invoice.paid for a brand-new membership
// signup, never on renewal invoices (see app/api/stripe-webhook/route.ts).
export async function sendMembershipWelcomeEmail(input: {
  email: string;
  name?: string | null;
  magicLinkUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const first = input.name?.split(" ")[0];
  const __body = [
      `${first ? `Hey ${first}` : "Hey"} — you're a member! Welcome in.`,
      "",
      "Here's what's live for you right now:",
      "  • 2 live-class credits every billing cycle — book any open class and the credit is honored, no code needed",
      "  • The full class-recording library, including sessions you didn't attend",
      "  • Member pricing on everything in the store",
      "",
      "Sign in here to see your account (link expires in 30 minutes):",
      input.magicLinkUrl,
      "",
      "That's where your credits, the recording library, and billing all live. If that link expires, request a new",
      "one any time at https://www.alexcoulombepresents.com/account.",
      "",
      "Questions, or want to cancel? Just reply — it goes straight to Alex.",
      "",
      "— Alex Coulombe Presents",
    ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    replyTo: "info@alexcoulombepresents.com",
    subject: "You're a member — welcome in",
    text: __body,
    html: brandedHtml(__body),
  });
  if (error) {
    console.error("Resend membership welcome email error:", error);
    throw new Error("Failed to send membership welcome email");
  }
}

export async function sendVoucherEmail(input: {
  email: string;
  name?: string;
  code: string;
  amountCents: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const first = input.name?.split(" ")[0];
  const __body = [
      `${first ? `Hey ${first}` : "Hey"} — thanks! Here's your voucher:`,
      "",
      `    ${input.code}`,
      "",
      "How to use it: pick any open-enrollment class at",
      "https://www.alexcoulombepresents.com/training (or /store), hit Buy, and",
      "enter the code at checkout — any intro or advanced class comes out to",
      "$0. (Private 1:1 sessions are separate.) One use, never expires, and",
      "it's transferable: gift the code to anyone by just sending it to them.",
      "",
      "Questions or want help picking a class? Just reply — it goes straight",
      "to Alex.",
      "",
      "— Alex Coulombe Presents",
      "https://www.alexcoulombepresents.com",
    ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    replyTo: "info@alexcoulombepresents.com",
    subject: `Your class voucher: ${input.code}`,
    text: __body,
    html: brandedHtml(__body),
  });
  if (error) throw new Error(`voucher email failed: ${error.message}`);
}

// Sent to every buyer of a Wednesday-calendar class that didn't reach its
// minEnrollment by the Tuesday-before check-in (app/api/telegram/webhook.ts
// class-no handling). Coupon is auto-generated (110% of what they paid);
// refund is a manual reply — no self-serve refund endpoint exists yet.
export async function sendClassCancelledEmail(input: {
  email: string;
  name?: string;
  className: string;
  amountPaidCents: number;
  couponCode: string;
  couponValueCents: number;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const first = input.name?.split(" ")[0];
  const fmt = (c: number) => `$${(c / 100).toFixed(c % 100 === 0 ? 0 : 2)}`;
  const __body = [
    `${first ? `Hey ${first}` : "Hey"} — bad news on "${input.className}": it didn't hit the 5-person`,
    "minimum, so it's not running as scheduled. Genuinely sorry — nobody likes an",
    "empty room, including us.",
    "",
    "Two ways to make it right, your choice:",
    "",
    `  1. A coupon worth ${fmt(input.couponValueCents)} (110% of what you paid) toward any future`,
    "     class or cohort — code below, no expiration.",
    "",
    `         ${input.couponCode}`,
    "",
    "  2. A full refund of your original payment — just reply to this email and",
    "     Alex will process it directly.",
    "",
    "Either way, keep an eye on the calendar at",
    "https://www.alexcoulombepresents.com/training#calendar — this topic will very",
    "likely be back.",
    "",
    "— Alex Coulombe Presents",
    "https://www.alexcoulombepresents.com",
  ].join("\n");
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: input.email,
    replyTo: "info@alexcoulombepresents.com",
    subject: `"${input.className}" didn't make the minimum — coupon or refund inside`,
    text: __body,
    html: brandedHtml(__body),
  });
  if (error) throw new Error(`class-cancelled email failed: ${error.message}`);
}
