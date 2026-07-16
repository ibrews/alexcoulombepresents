// ── Membership — infrastructure first, sales later ──────────────────────────
// The members program rides the EXISTING commerce rails: a membership is an
// entitlement with sku "membership" (granted by a future Stripe subscription
// webhook branch, or manually via SQL for comps). Nothing here sets a price
// or exposes a checkout — the public surface is a "coming soon" page with a
// founding-member waitlist until NEXT_PUBLIC_MEMBERSHIP_LIVE=1.

import { sql, ensureCommerceSchema } from "./schema";

export const MEMBERSHIP_SKU = "membership";
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
