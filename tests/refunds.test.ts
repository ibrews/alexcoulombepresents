// ── Refund decision tests ───────────────────────────────────────────────────
// lib/commerce/refunds.ts has no runtime imports, so these exercise the real
// branch logic against recorded Stripe charge shapes with no database.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { decideRefund, type StripeCharge } from "../lib/commerce/refunds.ts";

const PI = "pi_3U2ruPDALxplFYNo0q9VJVdG";

function charge(overrides: Partial<StripeCharge> = {}): StripeCharge {
  return { payment_intent: PI, refunded: false, amount: 14900, amount_refunded: 0, ...overrides };
}

// The regression. Lynne Heller, 2026-08-10: a $149 Unlimited membership,
// refunded 50% because she forgot a discount code. The webhook revoked her
// membership five minutes later and she kept paying with no access.
test("a 50% partial refund does NOT revoke (the Lynne Heller regression)", () => {
  const d = decideRefund(charge({ refunded: false, amount: 14900, amount_refunded: 7450 }));
  assert.equal(d.revoke, false);
  assert.equal(d.reason, "partial-refund");
});

test("a full refund revokes", () => {
  const d = decideRefund(charge({ refunded: true, amount: 14900, amount_refunded: 14900 }));
  assert.equal(d.revoke, true);
  assert.equal(d.reason, "full-refund");
});

test("refunded=true wins even if the amounts look partial (flag is authoritative)", () => {
  // Happens with a refunded application fee / rounding on multi-currency.
  const d = decideRefund(charge({ refunded: true, amount: 14900, amount_refunded: 100 }));
  assert.equal(d.revoke, true);
});

test("refunded=false is authoritative for a partial even when amounts are absent", () => {
  const d = decideRefund(charge({ refunded: false, amount: null, amount_refunded: null }));
  assert.equal(d.revoke, false);
  assert.equal(d.reason, "partial-refund");
});

test("falls back to amounts when the refunded flag is absent", () => {
  const partial = decideRefund(charge({ refunded: undefined, amount: 14900, amount_refunded: 7450 }));
  assert.equal(partial.revoke, false);
  assert.equal(partial.reason, "partial-refund");

  const full = decideRefund(charge({ refunded: undefined, amount: 14900, amount_refunded: 14900 }));
  assert.equal(full.revoke, true);
  assert.equal(full.reason, "full-refund");
});

test("over-refund (amount_refunded > amount) counts as full", () => {
  const d = decideRefund(charge({ refunded: undefined, amount: 14900, amount_refunded: 15000 }));
  assert.equal(d.revoke, true);
});

// Several partials that together clear the balance: Stripe flips `refunded`
// to true on the final one, so the last event is what revokes.
test("successive partials only revoke once they sum to the full amount", () => {
  const first = decideRefund(charge({ refunded: false, amount: 14900, amount_refunded: 5000 }));
  const second = decideRefund(charge({ refunded: false, amount: 14900, amount_refunded: 10000 }));
  const last = decideRefund(charge({ refunded: true, amount: 14900, amount_refunded: 14900 }));
  assert.equal(first.revoke, false);
  assert.equal(second.revoke, false);
  assert.equal(last.revoke, true);
});

// The asymmetry is deliberate: wrongly revoking silently destroys a paying
// customer's access, wrongly keeping it costs one product's revenue and is
// visible in Stripe. Fail toward the recoverable error.
test("an indeterminate payload does not revoke, and says so", () => {
  const d = decideRefund({ payment_intent: PI });
  assert.equal(d.revoke, false);
  assert.equal(d.reason, "indeterminate");
});

test("a charge with no payment_intent is a no-op (nothing to look up)", () => {
  assert.deepEqual(decideRefund({ payment_intent: null, refunded: true }).reason, "no-payment-intent");
  assert.equal(decideRefund({ payment_intent: null, refunded: true }).revoke, false);
  assert.equal(decideRefund({ refunded: true }).revoke, false);
});

test("amounts are echoed back for the caller's log line", () => {
  const d = decideRefund(charge({ amount: 14900, amount_refunded: 7450 }));
  assert.equal(d.amount, 14900);
  assert.equal(d.amountRefunded, 7450);
});
