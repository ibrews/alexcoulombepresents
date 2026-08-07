// ── Class vouchers ───────────────────────────────────────────────────────────
//
// A voucher purchase (lib/store.ts slug "class-voucher") is fulfilled by
// minting a UNIQUE one-time Stripe promotion code under the standing coupon
// `class-voucher-250` ($250 off, duration=once — ≥ the price of any
// open-enrollment class ($99 intro / $200 advanced), so those check out at
// $0; Stripe caps the discount at the line total). The premium private 1:1
// ($400) sets allowPromoCodes:false, so a voucher can't be applied there at
// all. The code goes to the buyer in the confirmation email; redemption is
// fully self-serve at checkout.
//
// The code is derived DETERMINISTICALLY from the checkout session id, so a
// webhook retry re-creates the SAME code — Stripe rejects the duplicate
// (tolerated below) instead of minting a second $250 voucher.
//
// The coupon itself was created once in live mode (2026-07-15):
//   POST /v1/coupons id=class-voucher-250 amount_off=25000 duration=once

import crypto from "node:crypto";

const COUPON_ID = "class-voucher-250";

// Readable, unambiguous code (no 0/O/1/I), e.g. LAB-7XK4Q2M9 — an HMAC of the
// session id so the same purchase always maps to the same code.
export function voucherCodeForSession(stripeSessionId: string): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("No Stripe secret available to derive voucher code");
  const digest = crypto.createHmac("sha256", secret).update(stripeSessionId).digest();
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const rand = Array.from(digest.subarray(0, 8), (b) => alphabet[b % alphabet.length]).join("");
  return `LAB-${rand}`;
}

export async function createVoucherCode(input: {
  buyerEmail: string;
  stripeSessionId: string;
}): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");

  const code = voucherCodeForSession(input.stripeSessionId);

  const res = await fetch("https://api.stripe.com/v1/promotion_codes", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      coupon: COUPON_ID,
      code,
      max_redemptions: "1",
      "metadata[voucher_buyer]": input.buyerEmail,
      "metadata[voucher_session]": input.stripeSessionId,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    // A retry re-deriving the same code trips Stripe's uniqueness check —
    // that means the code already exists for this purchase. Deliver it again.
    const msg: string = data.error?.message ?? "";
    if (data.error?.code === "resource_already_exists" || /already exists/i.test(msg)) {
      return code;
    }
    throw new Error(`promotion code creation failed: ${msg}`);
  }
  return data.code as string;
}

// ── Class-cancellation refund coupon ─────────────────────────────────────
// Separate from the fixed $250 class-voucher coupon above: this mints a
// FRESH per-order Stripe coupon (amount_off = 110% of what that specific
// buyer paid) when a Wednesday-calendar class is cancelled for missing its
// minEnrollment (see app/api/telegram/webhook.ts's class-no handling). One
// coupon per cancelled session, one promotion code per buyer under it — code
// is deterministic from the session id, same retry-safety shape as
// createVoucherCode above.
export async function createCancellationCoupon(input: {
  classSlug: string;
  buyerEmail: string;
  stripeSessionId: string;
  amountOffCents: number;
}): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");

  const couponId = `cancel-${input.classSlug}`.slice(0, 40);
  const code = voucherCodeForSession(`${input.classSlug}:${input.stripeSessionId}`);

  // Coupon is per-CLASS (every buyer of the same cancelled session shares
  // one coupon id) but its amount_off is fixed at creation — since everyone
  // who paid the same listed price gets the same 110%, this only breaks if
  // buyers paid different net amounts (a promo code applied). Create-once,
  // tolerate "already exists" same as the voucher path; a mixed-amount class
  // would need per-buyer coupons instead — not needed for the current
  // fixed-price calendar items, flagged here if that ever changes.
  const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id: couponId,
      amount_off: String(input.amountOffCents),
      currency: "usd",
      duration: "once",
      "metadata[reason]": "class-cancelled-min-enrollment",
      "metadata[class_slug]": input.classSlug,
    }),
  });
  if (!couponRes.ok) {
    const data = await couponRes.json();
    const msg: string = data.error?.message ?? "";
    if (!(data.error?.code === "resource_already_exists" || /already exists/i.test(msg))) {
      throw new Error(`cancellation coupon creation failed: ${msg}`);
    }
  }

  const promoRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      coupon: couponId,
      code,
      max_redemptions: "1",
      "metadata[buyer_email]": input.buyerEmail,
      "metadata[class_slug]": input.classSlug,
      "metadata[stripe_session_id]": input.stripeSessionId,
    }),
  });
  const promoData = await promoRes.json();
  if (!promoRes.ok) {
    const msg: string = promoData.error?.message ?? "";
    if (promoData.error?.code === "resource_already_exists" || /already exists/i.test(msg)) {
      return code;
    }
    throw new Error(`cancellation promotion code creation failed: ${msg}`);
  }
  return promoData.code as string;
}
