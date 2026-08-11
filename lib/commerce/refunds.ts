// ── Commerce core — refund decision logic ──────────────────────────────────
// Pure: given a Stripe charge object, decide whether this refund should
// revoke the buyer's entitlements and free their class seat. No side effects
// and no runtime imports, so it unit-tests against recorded Stripe shapes
// with no database — same split as membershipBilling.ts.
//
// This exists because the decision used to be an implicit "charge.refunded
// fired, so revoke everything," inline in the webhook route. Stripe fires
// charge.refunded for PARTIAL refunds too, so a goodwill partial refund
// silently destroyed paid access: Lynne Heller was refunded 50% on
// 2026-08-10 for a missed discount code and her active Unlimited membership
// was revoked five minutes later, while she kept paying.

export type StripeCharge = {
  payment_intent?: string | null;
  // True only once the charge is FULLY refunded — Stripe leaves it false for
  // partial refunds, including several partials that don't yet sum to the
  // full amount.
  refunded?: boolean | null;
  amount?: number | null;
  amount_refunded?: number | null;
};

export type RefundDecision = {
  // Whether to revoke entitlements + free the class seat.
  revoke: boolean;
  // Machine-readable why, for the webhook's log line.
  reason: "full-refund" | "partial-refund" | "indeterminate" | "no-payment-intent";
  amountRefunded: number | null;
  amount: number | null;
};

/**
 * Decides what a charge.refunded event should do.
 *
 * Only a FULL refund revokes. A partial refund leaves both the entitlements
 * and the seat alone: the customer still paid for (and still holds) the
 * thing, and a partially-refunded class seat is still occupied.
 *
 * When the charge carries neither the `refunded` flag nor both amounts, the
 * decision is "indeterminate" and we deliberately DON'T revoke. The asymmetry
 * is intentional: wrongly revoking destroys a paying customer's access
 * silently and is only discovered when they complain, while wrongly keeping
 * access costs one product's revenue and is visible in Stripe. Fail toward
 * the recoverable error. Callers should log the indeterminate case so it's
 * never silent — in practice Stripe always sends `refunded`, so this branch
 * firing at all means the payload shape changed and wants a look.
 */
export function decideRefund(charge: StripeCharge): RefundDecision {
  const amount = typeof charge.amount === "number" ? charge.amount : null;
  const amountRefunded = typeof charge.amount_refunded === "number" ? charge.amount_refunded : null;

  if (typeof charge.payment_intent !== "string" || !charge.payment_intent) {
    return { revoke: false, reason: "no-payment-intent", amountRefunded, amount };
  }

  if (charge.refunded === true) {
    return { revoke: true, reason: "full-refund", amountRefunded, amount };
  }

  // `refunded === false` is authoritative on its own: Stripe sets it false
  // for a partial. Only fall back to the amounts when the flag is absent.
  if (charge.refunded === false) {
    return { revoke: false, reason: "partial-refund", amountRefunded, amount };
  }

  if (amount !== null && amountRefunded !== null) {
    return amountRefunded >= amount
      ? { revoke: true, reason: "full-refund", amountRefunded, amount }
      : { revoke: false, reason: "partial-refund", amountRefunded, amount };
  }

  return { revoke: false, reason: "indeterminate", amountRefunded, amount };
}
