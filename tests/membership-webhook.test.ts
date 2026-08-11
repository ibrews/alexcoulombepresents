// ── Membership webhook branch tests ─────────────────────────────────────────
// Runs on Node's built-in test runner (node --test, type stripping — no test
// framework dependency). lib/commerce/membershipBilling.ts has no runtime
// imports, so these tests exercise the real branch logic against recorded
// Stripe fixture shapes with fake deps — no database, no network.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleMembershipEvent,
  STARTER_CREDITS_PER_CYCLE,
  MEMBERSHIP_SKU,
  type MembershipBillingDeps,
  type StripeEvent,
} from "../lib/commerce/membershipBilling.ts";

// Three tiers, three prices — a real customer is only ever on one at a time.
const STARTER_PRICE_ID = "price_membership_starter_test";
const UNLIMITED_PRICE_ID = "price_membership_unlimited_test";
const INSIDER_PRICE_ID = "price_membership_insider_test";
const PRICE_ID = STARTER_PRICE_ID; // default price most fixtures exercise
const PERIOD_END = 1_756_425_600; // epoch seconds; exact value is arbitrary
const PAID_THROUGH = new Date(PERIOD_END * 1000);

type Call = { fn: string; args: unknown[] };

function fakeDeps(overrides: Partial<MembershipBillingDeps> = {}) {
  const calls: Call[] = [];
  const record =
    <T,>(fn: string, result: T) =>
    (...args: unknown[]) => {
      calls.push({ fn, args });
      return Promise.resolve(result);
    };
  const deps: MembershipBillingDeps = {
    membershipPriceIds: {
      starter: [STARTER_PRICE_ID],
      unlimited: [UNLIMITED_PRICE_ID],
      insider: [INSIDER_PRICE_ID],
    },
    findOrCreateCustomer: record("findOrCreateCustomer", 42),
    setStripeCustomerId: record("setStripeCustomerId", undefined),
    customerIdForStripeCustomer: record("customerIdForStripeCustomer", 42),
    fetchStripeCustomer: record("fetchStripeCustomer", {
      email: "member@example.com",
      name: "Mem Ber",
    }),
    grantOrExtendMembership: record("grantOrExtendMembership", { isNew: true }),
    claimMembershipWelcome: record("claimMembershipWelcome", true),
    mintBookingCredits: record("mintBookingCredits", STARTER_CREDITS_PER_CYCLE),
    revokeMembership: record("revokeMembership", 3),
    checkoutSessionProcessed: record("checkoutSessionProcessed", false),
    recordCheckoutSession: record("recordCheckoutSession", undefined),
    linkMembershipCycleToOrder: record("linkMembershipCycleToOrder", undefined),
    ...overrides,
  };
  const called = (fn: string) => calls.filter((c) => c.fn === fn);
  return { deps, calls, called };
}

// ── Fixtures — trimmed to the fields Stripe webhook payloads carry ──────────

const invoicePaid = (overrides: Record<string, unknown> = {}): StripeEvent => ({
  id: "evt_inv_paid_1",
  type: "invoice.paid",
  data: {
    object: {
      id: "in_1QxTest",
      object: "invoice",
      customer: "cus_TestABC",
      customer_email: "member@example.com",
      customer_name: "Mem Ber",
      payment_intent: "pi_1QxTest",
      amount_paid: 2500,
      lines: {
        data: [
          {
            price: { id: PRICE_ID },
            period: { start: PERIOD_END - 2_678_400, end: PERIOD_END },
          },
        ],
      },
      ...overrides,
    },
  },
});

const subscriptionEvent = (
  type: string,
  overrides: Record<string, unknown> = {}
): StripeEvent => ({
  id: "evt_sub_1",
  type,
  data: {
    object: {
      id: "sub_1QxTest",
      object: "subscription",
      customer: "cus_TestABC",
      status: "active",
      current_period_end: PERIOD_END,
      items: { data: [{ price: { id: PRICE_ID } }] },
      ...overrides,
    },
  },
});

// ── invoice.paid ────────────────────────────────────────────────────────────

test("invoice.paid grants membership, mints credits, records + links the order", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(invoicePaid(), deps);

  assert.equal(result.handled, true);
  assert.equal(result.handled && result.newMember, true);
  assert.equal(result.handled && result.email, "member@example.com");
  assert.deepEqual(called("grantOrExtendMembership")[0].args, [42, PAID_THROUGH, "starter"]);
  assert.deepEqual(called("mintBookingCredits")[0].args, [42, STARTER_CREDITS_PER_CYCLE, PAID_THROUGH]);

  const recorded = called("recordCheckoutSession");
  assert.equal(recorded.length, 1);
  assert.deepEqual(recorded[0].args[0], {
    stripeEventId: "evt_inv_paid_1",
    stripeSessionId: "in_1QxTest",
    stripePaymentIntentId: "pi_1QxTest", // what lets charge.refunded find the order
    sku: MEMBERSHIP_SKU,
    email: "member@example.com",
    name: "Mem Ber",
    amountCents: 2500,
  });
  assert.deepEqual(called("linkMembershipCycleToOrder")[0].args, [42, "in_1QxTest", PAID_THROUGH]);
  assert.deepEqual(called("setStripeCustomerId")[0].args, [42, "cus_TestABC"]);
});

test("invoice.paid on a renewal (existing member) does not set newMember", async () => {
  const { deps } = fakeDeps({
    claimMembershipWelcome: () => Promise.resolve(false),
  });
  const result = await handleMembershipEvent(invoicePaid(), deps);
  assert.equal(result.handled, true);
  assert.equal(result.handled && result.newMember, false);
});

// Regression — the bug that suppressed EVERY membership welcome email until
// 2026-08-11. Stripe fires customer.subscription.updated (→ active) and
// invoice.paid milliseconds apart with no ordering guarantee; both call
// grantOrExtendMembership. When the subscription event lands first it INSERTs
// the row, so invoice.paid's upsert reports isNew=false — and the welcome
// email, which used to be gated on that flag, silently never sent. Both real
// subscribers on record hit this (neither was ever issued a magic link).
// newMember must track the atomic welcome claim, never the insert race.
test("invoice.paid still welcomes when subscription.updated already created the row (isNew=false)", async () => {
  const { deps } = fakeDeps({
    grantOrExtendMembership: () => Promise.resolve({ isNew: false }),
    claimMembershipWelcome: () => Promise.resolve(true),
  });
  const result = await handleMembershipEvent(invoicePaid(), deps);
  assert.equal(result.handled, true);
  assert.equal(result.handled && result.newMember, true);
  assert.equal(result.handled && result.email, "member@example.com");
});

test("the welcome claim is taken after the grant, so the row exists to claim", async () => {
  const { deps, calls } = fakeDeps();
  await handleMembershipEvent(invoicePaid(), deps);
  const grantAt = calls.findIndex((c) => c.fn === "grantOrExtendMembership");
  const claimAt = calls.findIndex((c) => c.fn === "claimMembershipWelcome");
  assert.ok(grantAt !== -1 && claimAt !== -1);
  assert.ok(grantAt < claimAt, "grant must precede the welcome claim");
});

test("invoice.paid dedupes on an already-processed event (check before work)", async () => {
  const { deps, called } = fakeDeps({
    checkoutSessionProcessed: () => Promise.resolve(true),
  });
  const result = await handleMembershipEvent(invoicePaid(), deps);

  assert.equal(result.handled, true);
  assert.equal(result.handled && result.deduped, true);
  assert.equal(called("grantOrExtendMembership").length, 0);
  assert.equal(called("mintBookingCredits").length, 0);
  assert.equal(called("recordCheckoutSession").length, 0);
});

test("invoice.paid for a non-membership price is ignored", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    invoicePaid({ lines: { data: [{ price: { id: "price_something_else" }, period: { end: PERIOD_END } }] } }),
    deps
  );
  assert.equal(result.handled, false);
  assert.equal(called("grantOrExtendMembership").length, 0);
});

test("invoice.paid with no STRIPE_MEMBERSHIP_PRICE_ID_* configured is a no-op", async () => {
  const { deps, calls } = fakeDeps({ membershipPriceIds: {} });
  const result = await handleMembershipEvent(invoicePaid(), deps);
  assert.equal(result.handled, false);
  assert.equal(calls.length, 0);
});

test("invoice.paid for the unlimited tier grants membership but mints zero credits", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    invoicePaid({ lines: { data: [{ price: { id: UNLIMITED_PRICE_ID }, period: { end: PERIOD_END } }] } }),
    deps
  );
  assert.equal(result.handled, true);
  assert.deepEqual(called("grantOrExtendMembership")[0].args, [42, PAID_THROUGH, "unlimited"]);
  assert.equal(called("mintBookingCredits").length, 0);
});

test("invoice.paid for the insider tier grants membership but mints zero credits", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    invoicePaid({ lines: { data: [{ price: { id: INSIDER_PRICE_ID }, period: { end: PERIOD_END } }] } }),
    deps
  );
  assert.equal(result.handled, true);
  assert.deepEqual(called("grantOrExtendMembership")[0].args, [42, PAID_THROUGH, "insider"]);
  assert.equal(called("mintBookingCredits").length, 0);
});

test("invoice.paid without customer_email falls back to fetching the Stripe customer", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(invoicePaid({ customer_email: null, customer_name: null }), deps);

  assert.equal(result.handled, true);
  assert.deepEqual(called("fetchStripeCustomer")[0].args, ["cus_TestABC"]);
  assert.deepEqual(called("findOrCreateCustomer")[0].args, ["member@example.com", "Mem Ber"]);
});

test("invoice.paid reads the 2025+ API shapes (pricing.price_details, payments list)", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    invoicePaid({
      payment_intent: undefined,
      payments: { data: [{ payment: { payment_intent: "pi_newshape" } }] },
      lines: {
        data: [
          {
            pricing: { price_details: { price: PRICE_ID } },
            period: { end: PERIOD_END },
          },
        ],
      },
    }),
    deps
  );
  assert.equal(result.handled, true);
  const recorded = called("recordCheckoutSession")[0].args[0] as { stripePaymentIntentId: string };
  assert.equal(recorded.stripePaymentIntentId, "pi_newshape");
});

// ── customer.subscription.created / updated ─────────────────────────────────

test("subscription.created (active) grants through current_period_end", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(subscriptionEvent("customer.subscription.created"), deps);

  assert.equal(result.handled, true);
  assert.deepEqual(called("grantOrExtendMembership")[0].args, [42, PAID_THROUGH, "starter"]);
  assert.equal(called("mintBookingCredits").length, 0); // credits mint on invoice.paid only
});

test("subscription events resolve unknown Stripe customers via the Stripe API", async () => {
  const { deps, called } = fakeDeps({
    customerIdForStripeCustomer: () => Promise.resolve(null),
  });
  const result = await handleMembershipEvent(subscriptionEvent("customer.subscription.created"), deps);

  assert.equal(result.handled, true);
  assert.deepEqual(called("fetchStripeCustomer")[0].args, ["cus_TestABC"]);
  assert.deepEqual(called("findOrCreateCustomer")[0].args, ["member@example.com", "Mem Ber"]);
  assert.deepEqual(called("setStripeCustomerId")[0].args, [42, "cus_TestABC"]);
});

test("subscription.created with status incomplete neither grants nor revokes (real Checkout flow: Stripe fires this before the payment confirms)", async () => {
  // Confirmed against a live rehearsal (2026-08-02): a real Checkout-driven
  // subscription always arrives as customer.subscription.created with
  // status="incomplete" first, then a later customer.subscription.updated
  // flips it to "active" once payment settles. This case wasn't in the
  // original fixture set and only surfaced by actually running the flow.
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.created", { status: "incomplete" }),
    deps
  );
  assert.equal(result.handled, false);
  assert.equal(called("grantOrExtendMembership").length, 0);
  assert.equal(called("revokeMembership").length, 0);
});

test("subscription.updated to canceled revokes", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.updated", { status: "canceled" }),
    deps
  );
  assert.equal(result.handled, true);
  assert.equal(called("revokeMembership").length, 1);
  assert.equal(called("grantOrExtendMembership").length, 0);
});

test("subscription.updated to past_due neither grants nor revokes (access lapses on its own)", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.updated", { status: "past_due" }),
    deps
  );
  assert.equal(result.handled, false);
  assert.equal(called("grantOrExtendMembership").length, 0);
  assert.equal(called("revokeMembership").length, 0);
});

test("subscription events read the 2025+ per-item current_period_end", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.updated", {
      current_period_end: undefined,
      items: { data: [{ price: { id: PRICE_ID }, current_period_end: PERIOD_END }] },
    }),
    deps
  );
  assert.equal(result.handled, true);
  assert.deepEqual(called("grantOrExtendMembership")[0].args, [42, PAID_THROUGH, "starter"]);
});

test("subscription events for a different price are ignored", async () => {
  const { deps, calls } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.created", {
      items: { data: [{ price: { id: "price_other" } }] },
    }),
    deps
  );
  assert.equal(result.handled, false);
  assert.equal(calls.length, 0);
});

// ── customer.subscription.deleted ───────────────────────────────────────────

test("subscription.deleted revokes membership + outstanding credits", async () => {
  const { deps, called } = fakeDeps();
  const result = await handleMembershipEvent(
    subscriptionEvent("customer.subscription.deleted", { status: "canceled" }),
    deps
  );
  assert.equal(result.handled, true);
  assert.deepEqual(called("revokeMembership")[0].args, [42]);
});

test("subscription.deleted with an unresolvable customer is reported, not thrown", async () => {
  const { deps, called } = fakeDeps({
    customerIdForStripeCustomer: () => Promise.resolve(null),
    fetchStripeCustomer: () => Promise.resolve(null),
  });
  const result = await handleMembershipEvent(subscriptionEvent("customer.subscription.deleted"), deps);
  assert.equal(result.handled, false);
  assert.equal(called("revokeMembership").length, 0);
});

// ── everything else ─────────────────────────────────────────────────────────

test("unrelated event types are ignored", async () => {
  const { deps, calls } = fakeDeps();
  const result = await handleMembershipEvent(
    { id: "evt_x", type: "checkout.session.completed", data: { object: {} } },
    deps
  );
  assert.equal(result.handled, false);
  assert.equal(calls.length, 0);
});
