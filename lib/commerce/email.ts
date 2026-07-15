// ── Commerce core — fulfillment email ───────────────────────────────────────

import { Resend } from "resend";
import { findDigitalProduct } from "./products";

export async function sendFulfillmentEmail(input: {
  email: string;
  sku: string;
  licenseKey: string;
  magicLinkUrl: string;
}) {
  const product = findDigitalProduct(input.sku);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: input.email,
    subject: `Your ${product?.name ?? input.sku} license + download`,
    text: [
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
    ].join("\n"),
  });

  if (error) {
    console.error("Resend fulfillment email error:", error);
    throw new Error("Failed to send fulfillment email");
  }
}

export async function sendMagicLinkEmail(input: { email: string; magicLinkUrl: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: input.email,
    subject: "Your Alex Coulombe Presents account link",
    text: [
      "Here's your sign-in link (expires in 30 minutes):",
      "",
      input.magicLinkUrl,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
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
  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    subject: `Lab donation: $${dollars} from ${input.name ?? input.email ?? "someone"}`,
    text: [
      `Amount: $${dollars}`,
      `From: ${input.name ?? "—"} <${input.email ?? "—"}>`,
      "",
      "Comment / request:",
      input.comment?.trim() || "(none)",
    ].join("\n"),
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

  const buyer = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: input.email,
    replyTo: "info@alexcoulombepresents.com",
    subject: `Order confirmed: ${input.itemName}`,
    text: [
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
    ].join("\n"),
  });
  if (buyer.error) throw new Error(`buyer confirmation failed: ${buyer.error.message}`);

  const owner = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    subject: `FULFILL: ${input.itemName} — $${dollars} from ${input.name ?? input.email}`,
    text: [
      `Item: ${input.itemName} (${input.slug})`,
      `Buyer: ${input.name ?? "—"} <${input.email}>`,
      `Amount: $${dollars}`,
      `Stripe session: ${input.sessionId}`,
      "",
      "Buyer got the confirmation email; complete the manual fulfillment",
      "(voucher code / booking link / scheduling) by replying to them.",
    ].join("\n"),
  });
  if (owner.error) console.error("owner fulfillment alert failed:", owner.error.message);
}
