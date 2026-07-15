// ── Class vouchers ───────────────────────────────────────────────────────────
//
// A voucher purchase (lib/store.ts slug "class-voucher") is fulfilled by
// minting a UNIQUE one-time Stripe promotion code under the standing coupon
// `class-voucher-199` ($199 off, duration=once — ≥ the price of any single
// class, so any class checks out at $0; applied to a bundle it's just $199
// off). The code goes to the buyer in the confirmation email; redemption is
// fully self-serve at checkout with zero human involvement.
//
// The coupon itself was created once in live mode (2026-07-15):
//   POST /v1/coupons id=class-voucher-199 amount_off=19900 duration=once

import crypto from "node:crypto";

const COUPON_ID = "class-voucher-199";

export async function createVoucherCode(input: {
  buyerEmail: string;
  stripeSessionId: string;
}): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");

  // Readable, unambiguous code (no 0/O/1/I), e.g. LAB-7XK4Q2M9.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const rand = Array.from(crypto.randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
  const code = `LAB-${rand}`;

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
  if (!res.ok) throw new Error(`promotion code creation failed: ${data.error?.message}`);
  return data.code as string;
}
