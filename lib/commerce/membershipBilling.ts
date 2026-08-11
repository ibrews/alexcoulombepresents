// ── Membership billing — Stripe subscription webhook orchestration ─────────
// Pure decision logic for the membership subscription lifecycle. All side
// effects (DB writes, Stripe REST reads) arrive via `deps`, so the webhook
// branches are unit-testable against recorded Stripe fixtures with no
// database — and this file must stay free of runtime imports for that reason.
//
// Billing model (membership-design.md, business plan §2.2–2.3):
//   invoice.paid                    → grant/extend `membership` + mint the
//                                     cycle's booking credits (idempotent)
//   customer.subscription.created/  → sync entitlement to subscription state
//     updated                         (extend on active/trialing; revoke on
//                                     canceled/unpaid; leave past_due alone —
//                                     the paid-through date lapses naturally)
//   customer.subscription.deleted   → revoke membership + outstanding credits
//   charge.refunded                 → handled by the existing webhook branch;
//                                     works here because each cycle's
//                                     entitlements link to the recorded
//                                     invoice order (source_order_id)

export const MEMBERSHIP_SKU = "membership";
export const BOOKING_CREDIT_SKU = "booking_credit";
// Pooled live-class credits per billing cycle for the "starter" tier only
// (2 classes + 1 office hours, see lib/commerce/membership.ts's
// MEMBERSHIP_TIERS comment on the pooling simplification). "unlimited" and
// "insider" skip credit minting entirely — see hasUnlimitedBooking. Credits
// expire with the cycle they were minted for; rollover (recommended: max 1
// month) is an open decision — revisit `updates_until` handling if granted.
export const STARTER_CREDITS_PER_CYCLE = 3;

export type MembershipTierId = "starter" | "unlimited" | "insider";

// Minimal structural types for the webhook payload shapes we touch. Stripe
// moved some fields between API versions (noted inline) — read both shapes.
export type StripeSubscriptionItem = {
  price?: { id?: string | null } | null;
  current_period_end?: number | null; // API 2025+: period lives on the item
};

export type StripeSubscription = {
  id: string;
  customer?: string | null;
  status: string;
  current_period_end?: number | null; // API ≤2024: period on the subscription
  items?: { data?: StripeSubscriptionItem[] | null } | null;
};

export type StripeInvoiceLine = {
  price?: { id?: string | null } | null; // API ≤2024
  pricing?: { price_details?: { price?: string | null } | null } | null; // API 2025+
  period?: { end?: number | null } | null;
};

export type StripeInvoice = {
  id: string;
  customer?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  payment_intent?: string | null; // API ≤2024
  payments?: { data?: Array<{ payment?: { payment_intent?: string | null } | null }> | null } | null; // API 2025+
  amount_paid?: number | null;
  lines?: { data?: StripeInvoiceLine[] | null } | null;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: unknown };
};

export type MembershipBillingDeps = {
  // Every valid Stripe Price id for each tier — plural because a tier can
  // have moved products/prices over time (e.g. the 2026-08-10 split from one
  // shared "ACP Membership" product to a dedicated product per tier) while
  // pre-existing subscribers stay on their original Price forever. All of
  // them must keep resolving to the same tier so an old subscriber's
  // renewal invoice still grants/extends correctly — only NEW checkouts
  // (app/api/checkout/route.ts) need the single "current" price id, which
  // is priceIds[tier][0] by convention. Empty/missing for any tier Alex
  // hasn't created in Stripe yet; events referencing a not-yet-configured
  // tier's price simply never match (same no-op behavior the single-price
  // version had).
  membershipPriceIds: Partial<Record<MembershipTierId, string[]>>;
  findOrCreateCustomer(email: string, name?: string | null): Promise<number>;
  setStripeCustomerId(customerId: number, stripeCustomerId: string): Promise<void>;
  customerIdForStripeCustomer(stripeCustomerId: string): Promise<number | null>;
  fetchStripeCustomer(stripeCustomerId: string): Promise<{ email: string | null; name: string | null } | null>;
  grantOrExtendMembership(customerId: number, paidThrough: Date, tier: MembershipTierId): Promise<{ isNew: boolean }>;
  // Returns true to exactly one caller per member, ever — see
  // lib/commerce/membership.ts. This, NOT grantOrExtendMembership's isNew, is
  // what decides whether the welcome email sends.
  claimMembershipWelcome(customerId: number): Promise<boolean>;
  mintBookingCredits(customerId: number, count: number, expiresAt: Date): Promise<number>;
  revokeMembership(customerId: number): Promise<number>;
  checkoutSessionProcessed(stripeEventId: string, stripeSessionId: string): Promise<boolean>;
  recordCheckoutSession(input: {
    stripeEventId: string;
    stripeSessionId: string;
    stripePaymentIntentId?: string | null;
    sku: string;
    email: string;
    name?: string | null;
    amountCents: number;
  }): Promise<void>;
  linkMembershipCycleToOrder(customerId: number, invoiceId: string, expiresAt: Date): Promise<void>;
};

export type MembershipEventResult =
  | { handled: false; reason: string }
  | {
      handled: true;
      action: string;
      deduped?: boolean;
      // Set on invoice.paid when THIS delivery won the atomic welcome claim
      // (deps.claimMembershipWelcome) — the webhook route uses it to fire the
      // welcome email exactly once per member, never on renewal invoices.
      // Deliberately not derived from grantOrExtendMembership's isNew: the
      // concurrent customer.subscription.updated event routinely wins that
      // insert, which silently suppressed every welcome email until 2026-08-11.
      newMember?: boolean;
      email?: string;
      name?: string | null;
      tier?: MembershipTierId;
      amountCents?: number;
    };

// Finds which configured tier (if any) an invoice's membership line or a
// subscription's item matches — a customer is only ever on one tier's price
// at a time, so first match wins.
function tierForPriceId(
  priceIds: Partial<Record<MembershipTierId, string[]>>,
  priceId: string | null | undefined
): MembershipTierId | null {
  if (!priceId) return null;
  const entry = (Object.entries(priceIds) as [MembershipTierId, string[] | undefined][]).find(([, ids]) =>
    ids?.includes(priceId)
  );
  return entry?.[0] ?? null;
}

function membershipInvoiceLine(
  invoice: StripeInvoice,
  priceIds: Partial<Record<MembershipTierId, string[]>>
): { line: StripeInvoiceLine; tier: MembershipTierId } | undefined {
  for (const line of invoice.lines?.data ?? []) {
    const tier = tierForPriceId(priceIds, line.price?.id ?? line.pricing?.price_details?.price);
    if (tier) return { line, tier };
  }
  return undefined;
}

function subscriptionTier(
  sub: StripeSubscription,
  priceIds: Partial<Record<MembershipTierId, string[]>>
): MembershipTierId | null {
  for (const item of sub.items?.data ?? []) {
    const tier = tierForPriceId(priceIds, item.price?.id);
    if (tier) return tier;
  }
  return null;
}

function subscriptionPeriodEnd(sub: StripeSubscription): number | null {
  return sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
}

function invoicePaymentIntent(invoice: StripeInvoice): string | null {
  return invoice.payment_intent ?? invoice.payments?.data?.[0]?.payment?.payment_intent ?? null;
}

// Resolves a Stripe customer id to our customers row, creating it from the
// Stripe-side email if we've never seen this customer (e.g. the subscription
// event arrives before its first invoice.paid).
async function resolveCustomer(
  stripeCustomerId: string | null | undefined,
  deps: MembershipBillingDeps
): Promise<number | null> {
  if (typeof stripeCustomerId !== "string" || !stripeCustomerId) return null;
  const known = await deps.customerIdForStripeCustomer(stripeCustomerId);
  if (known !== null) return known;
  const remote = await deps.fetchStripeCustomer(stripeCustomerId);
  if (!remote?.email) return null;
  const customerId = await deps.findOrCreateCustomer(remote.email, remote.name);
  await deps.setStripeCustomerId(customerId, stripeCustomerId);
  return customerId;
}

export async function handleMembershipEvent(
  event: StripeEvent,
  deps: MembershipBillingDeps
): Promise<MembershipEventResult> {
  const priceIds = deps.membershipPriceIds;
  const anyPriceConfigured = Object.values(priceIds).some((ids) => ids && ids.length > 0);

  if (event.type === "invoice.paid") {
    if (!anyPriceConfigured) return { handled: false, reason: "no STRIPE_MEMBERSHIP_PRICE_ID_* set" };
    const invoice = event.data.object as StripeInvoice;
    const match = membershipInvoiceLine(invoice, priceIds);
    if (!match) return { handled: false, reason: "no membership line on invoice" };
    const { line, tier } = match;

    // Same idempotency pattern as the checkout branches: dedupe on the event
    // id AND the invoice id (dashboard resends mint fresh event ids), check
    // BEFORE work, record only AFTER the work succeeded. The work itself is
    // also idempotent (extend-only grant; top-up-to-N mint), so a retry after
    // a mid-flight failure converges instead of double-granting.
    if (await deps.checkoutSessionProcessed(event.id, invoice.id)) {
      return { handled: true, action: "invoice already fulfilled", deduped: true };
    }

    let email = invoice.customer_email ?? null;
    let name = invoice.customer_name ?? null;
    if (!email && typeof invoice.customer === "string") {
      const remote = await deps.fetchStripeCustomer(invoice.customer);
      email = remote?.email ?? null;
      name = name ?? remote?.name ?? null;
    }
    if (!email) return { handled: false, reason: "invoice has no resolvable customer email" };

    const periodEnd = line.period?.end;
    if (!periodEnd) return { handled: false, reason: "membership line has no period end" };
    const paidThrough = new Date(periodEnd * 1000);

    const customerId = await deps.findOrCreateCustomer(email, name);
    if (typeof invoice.customer === "string" && invoice.customer) {
      await deps.setStripeCustomerId(customerId, invoice.customer);
    }

    await deps.grantOrExtendMembership(customerId, paidThrough, tier);
    // Claimed AFTER the grant, so the row is guaranteed to exist for the
    // UPDATE to match — and only ever true once per member.
    const isNew = await deps.claimMembershipWelcome(customerId);
    // "unlimited"/"insider" skip credit minting entirely — they never redeem
    // against the pooled-credit system, see hasUnlimitedBooking.
    const credits = tier === "starter" ? STARTER_CREDITS_PER_CYCLE : 0;
    if (credits > 0) await deps.mintBookingCredits(customerId, credits, paidThrough);
    await deps.recordCheckoutSession({
      stripeEventId: event.id,
      stripeSessionId: invoice.id,
      stripePaymentIntentId: invoicePaymentIntent(invoice),
      sku: MEMBERSHIP_SKU,
      email,
      name,
      amountCents: invoice.amount_paid ?? 0,
    });
    // Tie this cycle's entitlements to the recorded order so the existing
    // charge.refunded branch (revokeEntitlementsForPaymentIntent) revokes
    // them when THIS invoice is refunded.
    await deps.linkMembershipCycleToOrder(customerId, invoice.id, paidThrough);
    return {
      handled: true,
      action: `granted ${tier} through ${paidThrough.toISOString()}${credits > 0 ? ` + ${credits} credits` : " (unlimited)"}`,
      newMember: isNew,
      email,
      name,
      tier,
      amountCents: invoice.amount_paid ?? 0,
    };
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    if (!anyPriceConfigured) return { handled: false, reason: "no STRIPE_MEMBERSHIP_PRICE_ID_* set" };
    const sub = event.data.object as StripeSubscription;
    const tier = subscriptionTier(sub, priceIds);
    if (!tier) {
      return { handled: false, reason: "subscription is not a membership price" };
    }

    const customerId = await resolveCustomer(sub.customer, deps);
    if (customerId === null) return { handled: false, reason: "unresolvable Stripe customer" };

    // Subscription events are state syncs — processing one twice lands on the
    // same state, so no event-id dedupe is needed (or possible: no order row).
    const dead =
      event.type === "customer.subscription.deleted" ||
      sub.status === "canceled" ||
      sub.status === "unpaid" ||
      sub.status === "incomplete_expired";
    if (dead) {
      const revoked = await deps.revokeMembership(customerId);
      return { handled: true, action: `revoked ${revoked} entitlement(s)` };
    }

    if (sub.status === "active" || sub.status === "trialing") {
      const periodEnd = subscriptionPeriodEnd(sub);
      if (!periodEnd) return { handled: false, reason: "subscription has no period end" };
      const paidThrough = new Date(periodEnd * 1000);
      await deps.grantOrExtendMembership(customerId, paidThrough, tier);
      return { handled: true, action: `active (${tier}) through ${paidThrough.toISOString()}` };
    }

    // past_due / incomplete: no grant, no revoke — access simply lapses when
    // updates_until passes without a new invoice.paid extending it.
    return { handled: false, reason: `status ${sub.status} — no action` };
  }

  return { handled: false, reason: "unhandled event type" };
}
