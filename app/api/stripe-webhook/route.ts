import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  checkoutSessionProcessed,
  recordCheckoutSession,
  fulfillDigitalPurchase,
  revokeEntitlementsForPaymentIntent,
  findOrCreateCustomer,
  setStripeCustomerId,
  customerIdForStripeCustomer,
  grantOrRefreshMemberLicense,
} from "@/lib/commerce/entitlements";
import { MEMBER_LICENSE_WINDOW_DAYS } from "@/lib/commerce/memberLicensing";
import { decideRefund } from "@/lib/commerce/refunds";
import { markBookingPaid } from "@/lib/booking/config";
import { sendBookingPaidEmail } from "@/lib/booking/email";
import { findDigitalProduct } from "@/lib/commerce/products";
import {
  sendDonationNotification,
  sendFulfillmentEmail,
  sendOrderEmails,
  sendMembershipWelcomeEmail,
  sendMembershipOwnerNotification,
} from "@/lib/commerce/email";
import { storeItems, wednesdayCalendar } from "@/lib/store";
import { createVoucherCode } from "@/lib/commerce/vouchers";
import { sendVoucherEmail } from "@/lib/commerce/email";
import { issueMagicLink } from "@/lib/commerce/tokens";
import { recordCatalogOrder, markCatalogOrdersRefunded, getSeatsSold } from "@/lib/commerce/seats";
import { sendTelegramNotice } from "@/lib/telegram";
import {
  handleMembershipEvent,
  type MembershipBillingDeps,
  type MembershipTierId,
} from "@/lib/commerce/membershipBilling";
import {
  grantOrExtendMembership,
  claimMembershipWelcome,
  releaseMembershipWelcome,
  mintBookingCredits,
  revokeMembership,
  linkMembershipCycleToOrder,
  fetchStripeCustomer,
} from "@/lib/commerce/membership";

// Stripe webhook — fulfillment happens here.
// Configure in Stripe Dashboard → Developers → Webhooks:
//   endpoint: https://alexcoulombepresents.com/api/stripe-webhook
//   events:   checkout.session.completed, charge.refunded,
//             customer.subscription.created, customer.subscription.updated,
//             customer.subscription.deleted, invoice.paid
// Then set STRIPE_WEBHOOK_SECRET (whsec_...) in the environment.
// Membership subscriptions additionally need STRIPE_MEMBERSHIP_PRICE_ID
// (price_... of the membership subscription price) — until it's set, the
// subscription/invoice branches ignore every event.

// 2026-08-10: all three tiers originally shared one Stripe Product ("ACP
// Membership") with four Prices attached — which meant Checkout showed that
// shared product's name/description regardless of which tier a buyer picked
// (the bug behind Lynne Heller's Aug 10 Unlimited signup confusion). Split
// into one dedicated Product per tier so Checkout shows the right name.
// Pre-split subscribers stay on their original Price forever (Stripe doesn't
// migrate existing subscriptions when you swap what a new Checkout points
// at) — these must stay recognized here so their renewal invoices keep
// granting/extending correctly. Never remove an entry unless you've
// confirmed zero active subscriptions still reference it (Stripe dashboard →
// that price → Subscriptions count).
// The member-perk product auto-licensed on membership payment (mirrors
// /api/cron/xrsim-member-licenses' constant).
const XRSIM_SKU = "xrsim";

const LEGACY_MEMBERSHIP_PRICE_IDS: Record<MembershipTierId, string[]> = {
  starter: ["price_1U1fifDALxplFYNoASHbs3Sg"],
  unlimited: ["price_1U1fjUDALxplFYNoDJ5gOq0e"], // Lynne Heller's active subscription
  insider: ["price_1U1fk5DALxplFYNowUUbzkqi"],
};

// Live wiring for the membership branches (logic + tests live in
// lib/commerce/membershipBilling.ts). Assembled per-request so env reads
// stay lazy. priceIds[tier][0] is the CURRENT price — the one new checkouts
// use (see lib/commerce/membership.ts's priceEnvVar) — with legacy prices
// appended after it purely for renewal recognition.
function membershipDeps(): MembershipBillingDeps {
  const current: Partial<Record<MembershipTierId, string>> = {
    starter: process.env.STRIPE_MEMBERSHIP_PRICE_ID_STARTER,
    unlimited: process.env.STRIPE_MEMBERSHIP_PRICE_ID_UNLIMITED,
    insider: process.env.STRIPE_MEMBERSHIP_PRICE_ID_INSIDER,
  };
  const membershipPriceIds: Partial<Record<MembershipTierId, string[]>> = {};
  (Object.keys(LEGACY_MEMBERSHIP_PRICE_IDS) as MembershipTierId[]).forEach((tier) => {
    const currentId = current[tier];
    const legacy = LEGACY_MEMBERSHIP_PRICE_IDS[tier];
    membershipPriceIds[tier] = currentId && !legacy.includes(currentId) ? [currentId, ...legacy] : legacy;
  });

  return {
    membershipPriceIds,
    findOrCreateCustomer,
    setStripeCustomerId,
    customerIdForStripeCustomer,
    fetchStripeCustomer,
    grantOrExtendMembership,
    claimMembershipWelcome,
    mintBookingCredits,
    revokeMembership,
    checkoutSessionProcessed,
    recordCheckoutSession,
    linkMembershipCycleToOrder,
  };
}

// Pulls one Stripe Checkout custom_field's text answer off a session by key —
// shared by the donation "comment" field and any per-slug required field
// (e.g. office hours' "preferred_friday").
function customFieldText(session: { custom_fields?: unknown }, key: string): string | undefined {
  return (session.custom_fields as Array<{ key: string; text?: { value?: string } }> | undefined)?.find(
    (f) => f.key === key
  )?.text?.value;
}

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
    // Office hours' required "which Friday?" custom field (see checkout
    // route) — undefined for every other item, which is fine, it's optional.
    const preferredFriday = customFieldText(session, "preferred_friday");

    // ── Seat/order tracking (lib/commerce/seats.ts) — a real ledger backing
    // seat-count scarcity + the admin roster, covering every checkout kind
    // (catalog slug, voucher, donation, digital). Never let a DB hiccup here
    // break the existing email fulfillment below.
    try {
      await recordCatalogOrder({
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent ?? null,
        slug: slug ?? null,
        email: email ?? null,
        name: name ?? null,
        amountCents: session.amount_total ?? null,
        note: preferredFriday ?? null,
      });
    } catch (err) {
      console.error("[seats] order record failed", err);
    }

    if (kind === "booking") {
      // /book appointments (lib/booking). The slot was already held at
      // confirmation time, so this only flips it to paid and tells them.
      const bookingToken = session.metadata?.booking_token as string | undefined;
      if (bookingToken) {
        try {
          const paid = await markBookingPaid(bookingToken, session.id);
          if (paid) {
            await sendBookingPaidEmail(paid);
            console.log(`[booking] paid → ${paid.email} for ${paid.slot_start}`);
          } else {
            // Already paid — a webhook retry or a dashboard resend.
            console.log(`[booking] ${bookingToken} already marked paid, skipping`);
          }
        } catch (err) {
          console.error("[booking] payment fulfillment failed", err);
          // 500 so Stripe retries: markBookingPaid is idempotent, so the
          // retry converges instead of double-sending.
          return NextResponse.json({ error: "Booking fulfillment failed" }, { status: 500 });
        }
      }
    } else if (kind === "donation") {
      const comment = customFieldText(session, "comment");
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
      // ── Voucher: mint a one-time promo code and deliver it. Fully
      // self-serve — no manual fulfillment step. Idempotent against webhook
      // retries and dashboard resends: skip if already recorded; the code is
      // derived from the session id (re-creating it is a tolerated no-op);
      // the order is recorded LAST, after delivery succeeded, so a mid-flight
      // failure → 500 → retry re-runs delivery with the SAME code instead of
      // minting a second $250 voucher or dropping the email.
      try {
        if (await checkoutSessionProcessed(event.id, session.id)) {
          return NextResponse.json({ received: true, deduped: true });
        }
        const code = await createVoucherCode({ buyerEmail: email, stripeSessionId: session.id });
        await sendVoucherEmail({ email, name, code, amountCents: session.amount_total ?? 0 });
        await recordCheckoutSession({
          stripeEventId: event.id,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent ?? null,
          sku: slug,
          email,
          name,
          amountCents: session.amount_total ?? 0,
        });
        console.log(`[fulfill] voucher ${code} → ${email}`);
      } catch (err) {
        console.error("[fulfill] voucher failed", err);
        return NextResponse.json({ error: "Voucher fulfillment failed" }, { status: 500 });
      }
    } else if (slug && email) {
      // ── Manual-fulfillment catalog (lib/store.ts): confirm to the buyer,
      // alert Alex to fulfill. Same idempotency shape as vouchers: check
      // first, record after the emails actually sent.
      const item = storeItems.find((i) => i.slug === slug);
      try {
        if (await checkoutSessionProcessed(event.id, session.id)) {
          return NextResponse.json({ received: true, deduped: true });
        }

        // Seat count AFTER this order (recordCatalogOrder already ran above,
        // unconditionally, before this branch) — reused for both the
        // buyer-facing under-minimum warning and Alex's Telegram notice, so
        // they can never disagree with each other. Only meaningful for
        // dated Wednesday-calendar items (the only ones with a
        // minEnrollment target); best-effort, since a seat-count hiccup
        // must never block a real, already-charged confirmation email.
        let seatsSold: number | undefined;
        if (item?.sessionDateISO && item.minEnrollment !== undefined) {
          try {
            seatsSold = await getSeatsSold(slug);
          } catch (err) {
            console.error("[class-signup] seat count failed", err);
          }
        }

        await sendOrderEmails({
          email,
          name,
          slug,
          itemName: item?.name ?? slug,
          itemDelivery:
            item?.delivery ?? "Alex will follow up by email within a day to complete your order.",
          amountCents: session.amount_total ?? 0,
          sessionId: session.id,
          seatsSold,
          minEnrollment: item?.minEnrollment,
          bookingNote: preferredFriday,
          schedulingUrl: item?.schedulingUrl,
          zoomRegistrationUrl: item?.zoomRegistrationUrl,
        });
        await recordCheckoutSession({
          stripeEventId: event.id,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent ?? null,
          sku: slug,
          email,
          name,
          amountCents: session.amount_total ?? 0,
        });
        console.log(`[fulfill] ${fulfillment ?? "manual"} confirmation sent → ${email} for ${slug}`);

        // Dated Wednesday-calendar classes only (not every catalog item —
        // the running-total framing only makes sense where there's a
        // minEnrollment target to compare against). Best-effort: a Telegram
        // hiccup must never fail a real, already-charged purchase.
        if (wednesdayCalendar.some((c) => c.slug === slug)) {
          try {
            await sendTelegramNotice(
              `🎟 ${name ?? email} signed up for "${item?.name ?? slug}" — ${seatsSold ?? "?"} signed up so far.`
            );
          } catch (err) {
            console.error("[class-signup] telegram notice failed", err);
          }
        }
      } catch (err) {
        console.error("[fulfill] order emails failed", err);
        return NextResponse.json({ error: "Order email failed" }, { status: 500 });
      }
    }
  }

  if (
    event.type === "invoice.paid" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    // ── Membership subscription lifecycle: grant/extend the `membership`
    // entitlement + mint the cycle's booking credits on invoice.paid; revoke
    // on cancellation. Refunds ride the charge.refunded branch below.
    try {
      const result = await handleMembershipEvent(event, membershipDeps());
      if (result.handled) {
        console.log(`[membership] ${event.type} → ${result.action}`);
        if (result.deduped) return NextResponse.json({ received: true, deduped: true });

        // Provision the member-perk xrsim license immediately, rather than
        // leaving a new member unlicensed until the next daily cron run
        // (/api/cron/xrsim-member-licenses, 14:00 UTC). That batch-only
        // provisioning meant someone who subscribed after 14:00 UTC couldn't
        // download or run xrsim until the following day — which for a member
        // who joined the evening before an 11:00 ET Wednesday class left them
        // a one-hour margin, and no way to set up the night before.
        // Runs on every invoice.paid, not just first-ever grants: it's the
        // same idempotent upsert-and-resign the cron performs, so a renewal
        // simply refreshes the key early and the cron's 14-day rolling window
        // continues unchanged. Best-effort — never fail an already-paid
        // invoice over the perk license; the cron is still the safety net.
        if (event.type === "invoice.paid" && result.email) {
          try {
            const product = findDigitalProduct(XRSIM_SKU);
            if (product) {
              const customerId = await findOrCreateCustomer(result.email, result.name);
              const updatesUntil = new Date(
                Date.now() + MEMBER_LICENSE_WINDOW_DAYS * 24 * 60 * 60 * 1000
              );
              await grantOrRefreshMemberLicense(
                customerId,
                result.email,
                XRSIM_SKU,
                product.majorVersion,
                updatesUntil
              );
              console.log(`[membership] xrsim member license provisioned → ${result.email}`);
            }
          } catch (err) {
            console.error("[membership] xrsim license provisioning failed", err);
          }
        }

        // First-ever grant only — never fires on renewal invoices. A hiccup
        // here must not fail the webhook: the grant already succeeded, and a
        // 500 would make Stripe retry the (already-applied) grant forever.
        if (result.newMember && result.email) {
          try {
            const customerId = await findOrCreateCustomer(result.email, result.name);
            const magicToken = await issueMagicLink(customerId);
            const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
            const magicLinkUrl = `${site}/api/account/verify?token=${magicToken}`;
            if (result.tier) {
              await sendMembershipWelcomeEmail({
                email: result.email,
                name: result.name,
                magicLinkUrl,
                tier: result.tier,
              });
              await sendMembershipOwnerNotification({
                email: result.email,
                name: result.name,
                tier: result.tier,
                amountCents: result.amountCents ?? 0,
              });
            } else {
              console.error("[membership] welcome email skipped — no tier on result");
              await releaseMembershipWelcome(await findOrCreateCustomer(result.email, result.name));
            }
          } catch (err) {
            console.error("[membership] welcome email failed", err);
            // Hand the one-shot claim back so this member can still be
            // welcomed via /api/admin/resend-welcome. Nothing retries this
            // block, so without the release a transient Resend blip would
            // mean no welcome email, ever, silently.
            try {
              await releaseMembershipWelcome(await findOrCreateCustomer(result.email, result.name));
            } catch (releaseErr) {
              console.error("[membership] welcome claim release failed", releaseErr);
            }
          }
        }
      } else {
        console.log(`[membership] ${event.type} ignored — ${result.reason}`);
      }
    } catch (err) {
      console.error("[membership] webhook failed", err);
      // 500 so Stripe retries — a grant must not silently drop (every step in
      // handleMembershipEvent is idempotent, so the retry converges).
      return NextResponse.json({ error: "Membership fulfillment failed" }, { status: 500 });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent as string | undefined;
    // Only a FULL refund revokes — see lib/commerce/refunds.ts for why, and
    // for the partial-refund incident that prompted splitting this out.
    const decision = decideRefund(charge);
    if (!decision.revoke) {
      console.log(
        `[refund] ${decision.reason} on ${paymentIntentId ?? "(no payment_intent)"} — ` +
          `entitlements and seat left intact (${decision.amountRefunded} of ${decision.amount} refunded)`
      );
    }
    if (decision.reason === "indeterminate") {
      // Should be unreachable: Stripe always sends `refunded`. If this fires,
      // the payload shape changed and the fallback needs revisiting.
      console.error("[refund] indeterminate charge shape — not revoking; check the Stripe payload", {
        paymentIntentId,
      });
    }
    if (paymentIntentId && decision.revoke) {
      try {
        const revoked = await revokeEntitlementsForPaymentIntent(paymentIntentId);
        console.log(`[refund] revoked ${revoked} entitlement(s) for payment_intent ${paymentIntentId}`);
      } catch (err) {
        console.error("[refund] revoke failed", err);
        return NextResponse.json({ error: "Revoke failed" }, { status: 500 });
      }
      // Free the seat back up. Best-effort — must never break the
      // entitlement revoke above, which is the more consequential path.
      try {
        const freed = await markCatalogOrdersRefunded(paymentIntentId);
        if (freed > 0) console.log(`[refund] freed ${freed} catalog seat(s) for payment_intent ${paymentIntentId}`);
      } catch (err) {
        console.error("[seats] refund mark failed", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
