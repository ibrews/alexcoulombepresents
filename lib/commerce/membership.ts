// ── Membership — infrastructure first, sales later ──────────────────────────
// The members program rides the EXISTING commerce rails: a membership is an
// entitlement with sku "membership" (granted by the Stripe subscription
// branches in app/api/stripe-webhook via lib/commerce/membershipBilling.ts,
// or manually via SQL for comps). Nothing here sets a price or exposes a
// checkout — the public surface is a "coming soon" page with a
// founding-member waitlist until NEXT_PUBLIC_MEMBERSHIP_LIVE=1.

import { sql, ensureCommerceSchema } from "./schema";
import { MEMBERSHIP_SKU, BOOKING_CREDIT_SKU, type MembershipTierId } from "./membershipBilling";

export { MEMBERSHIP_SKU, BOOKING_CREDIT_SKU };
export type { MembershipTierId };
export const MEMBERSHIP_LIVE = process.env.NEXT_PUBLIC_MEMBERSHIP_LIVE === "1";

// ── Tiers — three, replacing the original single $50/mo tier (launched
// 2026-08-05, replaced 2026-08-07 with zero live subscribers — confirmed
// against prod before this change, so there was no migration to design for).
// Each tier is its own Stripe subscription Price, in its own env var — the
// entitlements.tier column (already existed, previously always 'member')
// now stores which one a customer is on.
export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  priceLabel: string;
  priceCents: number; // display only — the real number lives in the Stripe Price
  // Which env var holds this tier's Stripe Price ID. Until Alex creates the
  // three prices in Stripe and sets these, checkout for that tier 503s the
  // same way membership-at-large already 503s without STRIPE_MEMBERSHIP_PRICE_ID.
  priceEnvVar: string;
  // Multiplier applied to this tier's vote on /vote (lib/vote.ts) — a
  // non-member's vote is weight 1.
  voteWeight: number;
  // "unlimited" members skip the booking-credit system entirely (see
  // hasUnlimitedBooking below); starter gets a flat pooled monthly count.
  // NOTE: the ask was "2 classes + 1 office hours" specifically — this pools
  // both into one 3-credit count redeemable for either, which is a real
  // simplification of the admin honor-system redemption flow
  // (app/api/admin/credits) rather than tracking two credit types. Flagged
  // for Alex to split later if the pooling turns out to matter in practice.
  monthlyCredits: number | "unlimited";
  tagline: string;
  benefits: string[];
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$200/mo",
    priceCents: 20000,
    priceEnvVar: "STRIPE_MEMBERSHIP_PRICE_ID_STARTER",
    voteWeight: 2,
    monthlyCredits: 3,
    tagline: "2 classes + 1 office hours a month",
    benefits: [
      "3 live-class credits every month — 2 classes + 1 office hours, or however you want to split them",
      "Every class recording",
      "Member pricing on the store",
      "2x vote weight on what's taught next",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    priceLabel: "$350/mo",
    priceCents: 35000,
    priceEnvVar: "STRIPE_MEMBERSHIP_PRICE_ID_UNLIMITED",
    voteWeight: 4,
    monthlyCredits: "unlimited",
    tagline: "Unlimited classes and office hours",
    benefits: [
      "Unlimited live classes and office hours — no monthly cap",
      "Every class recording",
      "Member pricing on the store",
      "4x vote weight on what's taught next",
    ],
  },
  {
    id: "insider",
    name: "Insider",
    priceLabel: "$500/mo",
    priceCents: 50000,
    priceEnvVar: "STRIPE_MEMBERSHIP_PRICE_ID_INSIDER",
    voteWeight: 10,
    monthlyCredits: "unlimited",
    tagline: "Unlimited, plus the stuff nobody else sees",
    benefits: [
      "Everything in Unlimited",
      "Early access to in-progress tools and betas as they land in the Lab",
      "The full back catalog — sessions that don't surface anywhere else",
      "The Gumroad course library, bundled in (redemption codes by email after joining)",
      "10x vote weight on what's taught next",
    ],
  },
];

export function membershipTier(id: MembershipTierId | string | null | undefined): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.id === id);
}

// ── Derived marketing copy ─────────────────────────────────────────────────
// Marketing prose quotes these prices in several places (the /members hero
// and meta description, /training, the training calendar). Those were
// hardcoded and went stale the first time prices moved — the tier cards
// showed the new numbers while the surrounding copy still advertised the old
// ones, on a live public page. Deriving them here means the next price
// change can't reintroduce that contradiction.

/** The entry tier — what "cheapest way in" copy should quote. */
export const STARTER_TIER: MembershipTier =
  MEMBERSHIP_TIERS.find((t) => t.id === "starter") ?? MEMBERSHIP_TIERS[0];

/** e.g. "$200–$500/mo" — the full spread across tiers, for one-line summaries. */
export function membershipPriceRange(): string {
  const dollars = MEMBERSHIP_TIERS.map((t) => t.priceCents).sort((a, b) => a - b);
  const fmt = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
  return `${fmt(dollars[0])}–${fmt(dollars[dollars.length - 1])}/mo`;
}

export function hasUnlimitedBooking(tierId: MembershipTierId | string | null | undefined): boolean {
  return membershipTier(tierId)?.monthlyCredits === "unlimited";
}

// Vote weight for a given tier id — 1 (a normal, non-member vote) for
// anything unrecognized, including null/undefined.
export function voteWeightForTier(tierId: MembershipTierId | string | null | undefined): number {
  return membershipTier(tierId)?.voteWeight ?? 1;
}

// The benefits list is data, not copy-in-JSX, so /members, the store teaser,
// and future launch emails all describe the same program. Tier-agnostic
// items only (recordings + member pricing) — tier-specific perks live on
// MembershipTier.benefits above.
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
    detail:
      "First access to Lab tools like xrsim — test any OpenXR Android app locally, no headset needed — and whatever escapes the private repos next.",
  },
  {
    title: "Vote with extra weight",
    detail: "Members steer what gets taught and built next — your vote counts more, scaled to your tier.",
  },
  {
    title: "The Spatial Deck presentation library",
    detail:
      "Every public talk built and delivered in Spatial Deck, consolidated in one place with more context than a conference listing gives you — instead of hunting them down one at a time.",
  },
];

// True when the customer holds an active membership entitlement that hasn't
// lapsed (updates_until doubles as the paid-through date for subscriptions).
// Tier-agnostic on purpose — every tier is still "a member" for recordings/
// Lab-tools gating; use memberTierForCustomer for tier-specific checks (vote
// weight, insider-only perks).
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

// The active tier id for a customer, or null if not currently a member.
export async function memberTierForCustomer(customerId: number): Promise<MembershipTierId | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT tier FROM entitlements
    WHERE customer_id = ${customerId}
      AND sku = ${MEMBERSHIP_SKU}
      AND status = 'active'
      AND (updates_until IS NULL OR updates_until > now())
    LIMIT 1
  `) as { tier: string }[];
  const tier = rows[0]?.tier;
  return membershipTier(tier) ? (tier as MembershipTierId) : null;
}

// Same, keyed by email — for /vote, which only ever collects an email, never
// a session/customer id. Returns null for a non-member or an email with no
// customer row at all (someone who's never checked out anything).
export async function memberTierForEmail(email: string): Promise<MembershipTierId | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT e.tier AS tier FROM entitlements e
    JOIN customers c ON c.id = e.customer_id
    WHERE lower(c.email) = lower(${email})
      AND e.sku = ${MEMBERSHIP_SKU}
      AND e.status = 'active'
      AND (e.updates_until IS NULL OR e.updates_until > now())
    LIMIT 1
  `) as { tier: string }[];
  const tier = rows[0]?.tier;
  return membershipTier(tier) ? (tier as MembershipTierId) : null;
}

// ── Subscription-webhook persistence (wired into membershipBilling deps) ────

// Extend-only upsert: never shrinks the paid-through date (webhook events can
// arrive out of order), always re-activates (a lapsed member who resubscribes
// gets the same row back). No unique index on (customer_id, sku) exists, so
// this is UPDATE-then-INSERT; a duplicate row from a webhook race is harmless
// (isMember/revoke treat all of a customer's membership rows alike).
// Atomic upsert on the partial unique index (entitlements_one_membership_per_
// customer, schema.ts) — NOT a check-then-insert, which is racy: Stripe
// fires customer.subscription.updated and invoice.paid within milliseconds
// of each other for the same signup, and two concurrent webhook requests
// both seeing "no row yet" would otherwise both insert (confirmed happening
// in rehearsal before this fix — duplicate membership rows for one signup).
// Returns isNew=true when this INSERT created the row. NOTE: that is NOT the
// same question as "is this a brand-new member" — customer.subscription.
// updated and invoice.paid both call this for one signup, and whichever loses
// the race sees isNew=false. Gate the welcome email on claimMembershipWelcome
// below, never on isNew.
// `tier` is written on every call, including renewals — an upgrade/downgrade
// shows up as a new Stripe price on the next invoice.paid/subscription.updated,
// and the member's row should reflect whichever price is actually current,
// not whatever they first signed up at.
export async function grantOrExtendMembership(
  customerId: number,
  paidThrough: Date,
  tier: MembershipTierId
): Promise<{ isNew: boolean }> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    INSERT INTO entitlements (customer_id, sku, tier, status, updates_until)
    VALUES (${customerId}, ${MEMBERSHIP_SKU}, ${tier}, 'active', ${paidThrough.toISOString()})
    ON CONFLICT (customer_id) WHERE sku = 'membership'
    DO UPDATE SET
      tier = EXCLUDED.tier,
      status = 'active',
      revoked_at = NULL,
      updates_until = GREATEST(
        COALESCE(entitlements.updates_until, to_timestamp(0)),
        EXCLUDED.updates_until
      )
    RETURNING (xmax = 0) AS inserted
  `) as { inserted: boolean }[];
  return { isNew: rows[0]?.inserted ?? true };
}

// Atomically claims the right to send this member's welcome email, returning
// true to exactly one caller ever (per membership row). The UPDATE's
// `welcomed_at IS NULL` predicate is evaluated under Postgres row locking, so
// concurrent webhook deliveries — the whole reason the old isNew flag failed —
// serialize here instead of racing: the loser's UPDATE matches zero rows.
//
// Why this exists (2026-08-11): Stripe fires customer.subscription.updated
// (status → active) and invoice.paid within milliseconds and in no guaranteed
// order. Both branches call grantOrExtendMembership; whichever ran second got
// isNew=false, and the welcome email was gated on invoice.paid's isNew. In
// practice the subscription event won every time, so NO membership signup ever
// sent its welcome email or owner alert — confirmed against both real
// subscribers on record (no magic_links row was ever issued for either).
export async function claimMembershipWelcome(customerId: number): Promise<boolean> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE entitlements SET welcomed_at = now()
    WHERE customer_id = ${customerId} AND sku = ${MEMBERSHIP_SKU} AND welcomed_at IS NULL
    RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

// Hands the welcome claim back after a failed send, so the member can still
// be welcomed later. Without this, a transient Resend error would burn the
// one-shot claim and that member would never get a welcome email — silently,
// which is precisely the failure mode claimMembershipWelcome exists to end.
// Nothing retries the webhook (the welcome block deliberately swallows its
// errors so an already-applied grant isn't retried forever), so the recovery
// path is POST /api/admin/resend-welcome, which this makes work without
// needing `force`.
export async function releaseMembershipWelcome(customerId: number): Promise<void> {
  await ensureCommerceSchema();
  await sql()`
    UPDATE entitlements SET welcomed_at = NULL
    WHERE customer_id = ${customerId} AND sku = ${MEMBERSHIP_SKU}
  `;
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
