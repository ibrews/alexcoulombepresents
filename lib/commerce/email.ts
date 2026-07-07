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
