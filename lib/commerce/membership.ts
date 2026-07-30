// ── Membership — infrastructure first, sales later ──────────────────────────
// The members program rides the EXISTING commerce rails: a membership is an
// entitlement with sku "membership" (granted by the Stripe subscription
// branches in app/api/stripe-webhook via lib/commerce/membershipBilling.ts,
// or manually via SQL for comps). Nothing here sets a price or exposes a
// checkout — the public surface is a "coming soon" page with a
// founding-member waitlist until NEXT_PUBLIC_MEMBERSHIP_LIVE=1.

import { sql, ensureCommerceSchema } from "./schema";
import { MEMBERSHIP_SKU, BOOKING_CREDIT_SKU } from "./membershipBilling";

export { MEMBERSHIP_SKU, BOOKING_CREDIT_SKU };
export const MEMBERSHIP_LIVE = process.env.NEXT_PUBLIC_MEMBERSHIP_LIVE === "1";

// The benefits list is data, not copy-in-JSX, so /members, the store teaser,
// and future launch emails all describe the same program.
export const memberBenefits: { title: string; detail: string }[] = [
  {
    title: "Every class recording",
    detail:
      "The growing library of live class and cohort recordings — including sessions you didn't attend — searchable and streamable.",
  },
  {
    title: "Member pricing on everything",
    detail: "Standing discounts on open-enrollment classes, cohorts, and digital pipelines in the store.",
  },
  {
    title: "Early access to the Lab",
    detail: "First seats for Pinchwork, UnRealityKit Bridge, and whatever escapes the private repos next.",
  },
  {
    title: "Monthly members' office hours",
    detail: "A live AMA hour with Alex — bring your broken Blueprint, your pipeline question, your career fork.",
  },
  {
    title: "Vote with extra weight",
    detail: "Members steer what gets taught and built next — your vote counts double on upcoming class topics.",
  },
];

// True when the customer holds an active membership entitlement that hasn't
// lapsed (updates_until doubles as the paid-through date for subscriptions).
export async function isMember(customerId: number): Promise<boolean> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id FROM entitlements
    WHERE customer_id = ${customerId}
      AND sku = ${MEMBERSHIP_SKU}
      AND status = 'active'
      AND (updates_until IS NULL OR updates_until > now())
    LIMIT 1
  `) as { id: number }[];
  return rows.length > 0;
}

// ── Subscription-webhook persistence (wired into membershipBilling deps) ────

// Extend-only upsert: never shrinks the paid-through date (webhook events can
// arrive out of order), always re-activates (a lapsed member who resubscribes
// gets the same row back). No unique index on (customer_id, sku) exists, so
// this is UPDATE-then-INSERT; a duplicate row from a webhook race is harmless
// (isMember/revoke treat all of a customer's membership rows alike).
export async function grantOrExtendMembership(customerId: number, paidThrough: Date): Promise<void> {
  await ensureCommerceSchema();
  const db = sql();
  const updated = (await db`
    UPDATE entitlements
    SET status = 'active', revoked_at = NULL,
        updates_until = GREATEST(COALESCE(updates_until, to_timestamp(0)), ${paidThrough.toISOString()}::timestamptz)
    WHERE customer_id = ${customerId} AND sku = ${MEMBERSHIP_SKU}
    RETURNING id
  `) as { id: number }[];
  if (updated.length === 0) {
    await db`
      INSERT INTO entitlements (customer_id, sku, tier, status, updates_until)
      VALUES (${customerId}, ${MEMBERSHIP_SKU}, 'member', 'active', ${paidThrough.toISOString()})
    `;
  }
}

// Tops the cycle's credits up to `count` instead of blindly inserting, keyed
// on the cycle's expiry — so a webhook retry after a mid-flight failure never
// double-mints. Counts every status (a credit redeemed mid-retry still counts
// toward the cycle). Returns how many were newly minted.
export async function mintBookingCredits(customerId: number, count: number, expiresAt: Date): Promise<number> {
  await ensureCommerceSchema();
  const db = sql();
  const existing = (await db`
    SELECT count(*)::int AS n FROM entitlements
    WHERE customer_id = ${customerId} AND sku = ${BOOKING_CREDIT_SKU}
      AND updates_until = ${expiresAt.toISOString()}::timestamptz
  `) as { n: number }[];
  const missing = Math.max(0, count - (existing[0]?.n ?? 0));
  for (let i = 0; i < missing; i++) {
    await db`
      INSERT INTO entitlements (customer_id, sku, tier, status, updates_until)
      VALUES (${customerId}, ${BOOKING_CREDIT_SKU}, 'member', 'active', ${expiresAt.toISOString()})
    `;
  }
  return missing;
}

// Cancellation kills the membership AND any outstanding credits — credits are
// a membership benefit, not a standalone purchase. Returns rows revoked.
export async function revokeMembership(customerId: number): Promise<number> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE entitlements SET status = 'revoked', revoked_at = now()
    WHERE customer_id = ${customerId}
      AND sku = ANY(${[MEMBERSHIP_SKU, BOOKING_CREDIT_SKU]})
      AND status = 'active'
    RETURNING id
  `) as { id: number }[];
  return rows.length;
}

// Points this cycle's membership + credit entitlements at the recorded
// invoice order, so the existing charge.refunded branch
// (revokeEntitlementsForPaymentIntent) revokes them if the invoice refunds.
export async function linkMembershipCycleToOrder(
  customerId: number,
  invoiceId: string,
  expiresAt: Date
): Promise<void> {
  await ensureCommerceSchema();
  await sql()`
    UPDATE entitlements e
    SET source_order_id = o.id
    FROM orders o
    WHERE o.stripe_session_id = ${invoiceId}
      AND e.customer_id = ${customerId}
      AND e.sku = ANY(${[MEMBERSHIP_SKU, BOOKING_CREDIT_SKU]})
      AND e.updates_until = ${expiresAt.toISOString()}::timestamptz
  `;
}

// Reads the customer's email/name off Stripe when a subscription event
// arrives for a cus_… id we've never stored (e.g. before its first
// invoice.paid). Returns null on any failure — callers treat that as
// "unresolvable" and skip rather than crash the webhook.
export async function fetchStripeCustomer(
  stripeCustomerId: string
): Promise<{ email: string | null; name: string | null } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const res = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const customer = (await res.json()) as { deleted?: boolean; email?: string | null; name?: string | null };
  if (customer.deleted) return null;
  return { email: customer.email ?? null, name: customer.name ?? null };
}

// ── Booking-credit redemption — manual/admin honor system (launch step 4) ───
// Cal.com integration comes later (business plan §2.7); until then Alex
// redeems a credit via /api/admin/credits when a member books a class.

export type BookingCreditRow = {
  id: number;
  status: string;
  updates_until: string | null;
  created_at: string;
  revoked_at: string | null; // doubles as the consumed-at stamp for status 'redeemed'
};

export async function bookingCreditsForCustomer(customerId: number): Promise<BookingCreditRow[]> {
  await ensureCommerceSchema();
  return (await sql()`
    SELECT id, status, updates_until, created_at, revoked_at
    FROM entitlements
    WHERE customer_id = ${customerId} AND sku = ${BOOKING_CREDIT_SKU}
    ORDER BY created_at DESC, id DESC
  `) as BookingCreditRow[];
}

// Consumes the soonest-expiring usable credit (use-it-before-you-lose-it).
export async function redeemOldestBookingCredit(customerId: number): Promise<number | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE entitlements SET status = 'redeemed', revoked_at = now()
    WHERE id = (
      SELECT id FROM entitlements
      WHERE customer_id = ${customerId} AND sku = ${BOOKING_CREDIT_SKU}
        AND status = 'active'
        AND (updates_until IS NULL OR updates_until > now())
      ORDER BY updates_until ASC NULLS LAST, id ASC
      LIMIT 1
    )
    RETURNING id
  `) as { id: number }[];
  return rows[0]?.id ?? null;
}
