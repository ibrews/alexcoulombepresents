import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { fulfillDigitalPurchase, revokeEntitlementsForPaymentIntent } from "@/lib/commerce/entitlements";
import { sendFulfillmentEmail } from "@/lib/commerce/email";
import { issueMagicLink } from "@/lib/commerce/tokens";

// Stripe webhook — fulfillment happens here.
// Configure in Stripe Dashboard → Developers → Webhooks:
//   endpoint: https://alexcoulombepresents.com/api/stripe-webhook
//   events:   checkout.session.completed, charge.refunded
// Then set STRIPE_WEBHOOK_SECRET (whsec_...) in the environment.

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  // Reject stale events (>5 min) to prevent replay
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const slug = session.metadata?.slug as string | undefined;
    const sku = session.metadata?.sku as string | undefined;
    const kind = session.metadata?.kind as string | undefined;
    const fulfillment = session.metadata?.fulfillment as string | undefined;
    const email = session.customer_details?.email as string | undefined;
    const name = session.customer_details?.name as string | undefined;

    if (kind === "digital" && sku && email) {
      try {
        const result = await fulfillDigitalPurchase({
          stripeEventId: event.id,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent ?? null,
          sku,
          email,
          name,
          amountCents: session.amount_total ?? 0,
        });
        if (!result.alreadyProcessed && result.licenseKey && result.customerId) {
          const magicToken = await issueMagicLink(result.customerId);
          const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
          const magicLinkUrl = `${site}/api/account/verify?token=${magicToken}`;
          await sendFulfillmentEmail({ email, sku, licenseKey: result.licenseKey, magicLinkUrl });
        }
      } catch (err) {
        console.error("[fulfill] digital purchase failed", err);
        // Return 500 so Stripe retries — fulfillment must not silently drop.
        return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
      }
    } else {
      // ── Manual-fulfillment catalog (lib/store.ts) — bones, unchanged ──
      switch (fulfillment) {
        case "download-link":
          console.log(`[fulfill] download-link → ${email} for ${slug}`);
          break;
        case "github-invite":
          console.log(`[fulfill] github-invite → ${email} for ${slug}`);
          break;
        case "booking":
          console.log(`[fulfill] booking → ${email} for ${slug}`);
          break;
        default:
          console.log(`[fulfill] manual → ${email} for ${slug}`);
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent as string | undefined;
    if (paymentIntentId) {
      try {
        const revoked = await revokeEntitlementsForPaymentIntent(paymentIntentId);
        console.log(`[refund] revoked ${revoked} entitlement(s) for payment_intent ${paymentIntentId}`);
      } catch (err) {
        console.error("[refund] revoke failed", err);
        return NextResponse.json({ error: "Revoke failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
