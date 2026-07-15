import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { fulfillDigitalPurchase, revokeEntitlementsForPaymentIntent } from "@/lib/commerce/entitlements";
import { sendDonationNotification, sendFulfillmentEmail, sendOrderEmails } from "@/lib/commerce/email";
import { storeItems } from "@/lib/store";
import { createVoucherCode } from "@/lib/commerce/vouchers";
import { sendVoucherEmail } from "@/lib/commerce/email";
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

    if (kind === "donation") {
      const comment = (session.custom_fields as Array<{ key: string; text?: { value?: string } }> | undefined)?.find(
        (f) => f.key === "comment"
      )?.text?.value;
      try {
        await sendDonationNotification({
          amountCents: session.amount_total ?? 0,
          email,
          name,
          comment,
        });
      } catch (err) {
        // Log only — a donation must never bounce as failed just because the
        // notification email hiccuped; the money and comment are in Stripe.
        console.error("[donation] notification failed", err);
      }
    } else if (kind === "digital" && sku && email) {
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
    } else if (slug === "class-voucher" && email) {
      // ── Voucher: mint a unique one-time promo code and deliver it. Fully
      // self-serve — no manual fulfillment step. Failure → 500 so Stripe retries.
      try {
        const code = await createVoucherCode({ buyerEmail: email, stripeSessionId: session.id });
        await sendVoucherEmail({ email, name, code, amountCents: session.amount_total ?? 0 });
        console.log(`[fulfill] voucher ${code} → ${email}`);
      } catch (err) {
        console.error("[fulfill] voucher failed", err);
        return NextResponse.json({ error: "Voucher fulfillment failed" }, { status: 500 });
      }
    } else if (slug && email) {
      // ── Manual-fulfillment catalog (lib/store.ts): confirm to the buyer,
      // alert Alex to fulfill. Failure → 500 so Stripe retries the event.
      const item = storeItems.find((i) => i.slug === slug);
      try {
        await sendOrderEmails({
          email,
          name,
          slug,
          itemName: item?.name ?? slug,
          itemDelivery:
            item?.delivery ?? "Alex will follow up by email within a day to complete your order.",
          amountCents: session.amount_total ?? 0,
          sessionId: session.id,
        });
        console.log(`[fulfill] ${fulfillment ?? "manual"} confirmation sent → ${email} for ${slug}`);
      } catch (err) {
        console.error("[fulfill] order emails failed", err);
        return NextResponse.json({ error: "Order email failed" }, { status: 500 });
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
