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
    '<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6fa;">',
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
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dollars = (input.amountCents / 100).toFixed(2);
  const first = input.name?.split(" ")[0];

  const __body = [
      `${first ? `Hey ${first}` : "Hey"} — thanks! Your order is confirmed.`,
      "",
      `  ${input.itemName} — $${dollars}`,
      "",
      `What happens next: ${input.itemDelivery}`,
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
      "How to use it: pick any class at",
      "https://www.alexcoulombepresents.com/training (or /store), hit Buy, and",
      "enter the code at checkout — any single class, any level, comes out to",
      "$0. One use, never expires, and it's transferable: gift the code to",
      "anyone by just sending it to them.",
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
