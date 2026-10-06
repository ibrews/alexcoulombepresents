// ── Comp + gift membership grants — pure merge logic ────────────────────────
// A membership that no Stripe subscription backs: a comp from Alex (lifetime
// Insider for guest instructors, decision 2026-10-06) or a fixed-term gift
// someone bought. Both land on the SAME single membership row per customer
// as subscriptions do (entitlements_one_membership_per_customer, schema.ts),
// so a grant has to MERGE with whatever is already there instead of
// overwriting it. The rules, all in planMembershipGrant below:
//   - never shorten an existing paid-through date (lifetime beats any date)
//   - never downgrade a higher existing tier
//   - a lapsed or revoked row is a fresh start, not something to merge with
//
// No runtime imports (same split as membershipBilling.ts): the merge rules
// and the compare-and-set retry loop are unit-tested with fake deps, and
// lib/commerce/membership.ts's grantCompMembership wires the real SQL.

import type { MembershipTierId } from "./membershipBilling";

export type GrantSource = "comp" | "gift";

// Higher number = more access. Unknown tiers (e.g. a legacy 'member' row)
// rank 0, so any real tier is treated as an upgrade over them.
export const TIER_RANK: Record<MembershipTierId, number> = { starter: 1, unlimited: 2, insider: 3 };

export function tierRank(tier: string | null | undefined): number {
  return TIER_RANK[tier as MembershipTierId] ?? 0;
}

/** The membership row as it stands before a grant. `version` is an opaque
 * row-version token (Postgres xmin) used for compare-and-set. */
export type ExistingMembership = {
  tier: string;
  status: string;
  updatesUntil: Date | null;
  grantSource: string | null;
  version: string;
};

export type MembershipGrantRequest = {
  tier: MembershipTierId;
  until: Date | null; // null = lifetime
  source: GrantSource;
};

export type MembershipGrantPlan = {
  action: "insert" | "reactivate" | "extend" | "unchanged";
  tier: string;
  until: Date | null;
  source: string | null;
  /** The existing row outranked the requested tier, so it was kept. */
  keptHigherTier: boolean;
  /** The existing row already ran longer than the request, so it was kept. */
  keptLongerDate: boolean;
  /** The existing row is a live, Stripe-subscription-backed membership. A comp
   * on top of it doesn't stop Stripe billing them — the caller should say so. */
  activeSubscription: boolean;
};

function isLive(existing: ExistingMembership, now: Date): boolean {
  return existing.status === "active" && (existing.updatesUntil === null || existing.updatesUntil > now);
}

function sameInstant(a: Date | null, b: Date | null): boolean {
  if (a === null || b === null) return a === b;
  return a.getTime() === b.getTime();
}

export function planMembershipGrant(
  existing: ExistingMembership | null,
  req: MembershipGrantRequest,
  now: Date
): MembershipGrantPlan {
  const fresh = (action: "insert" | "reactivate"): MembershipGrantPlan => ({
    action,
    tier: req.tier,
    until: req.until,
    source: req.source,
    keptHigherTier: false,
    keptLongerDate: false,
    activeSubscription: false,
  });
  if (!existing) return fresh("insert");
  // A revoked (cancelled/refunded) or expired row carries nothing worth
  // preserving — merging with its stale date could hand out time nobody paid
  // for (a cancellation leaves updates_until wherever the last cycle ended).
  if (!isLive(existing, now)) return fresh("reactivate");

  const keptHigherTier = tierRank(existing.tier) > tierRank(req.tier);
  const tier = keptHigherTier ? existing.tier : req.tier;

  let until: Date | null;
  let keptLongerDate = false;
  if (existing.updatesUntil === null) {
    until = null;
    keptLongerDate = req.until !== null;
  } else if (req.until === null) {
    until = null;
  } else if (existing.updatesUntil >= req.until) {
    until = existing.updatesUntil;
    keptLongerDate = true;
  } else {
    until = req.until;
  }

  const activeSubscription = existing.grantSource === null && existing.updatesUntil !== null;
  const unchanged = tier === existing.tier && sameInstant(until, existing.updatesUntil);
  return {
    action: unchanged ? "unchanged" : "extend",
    tier,
    until,
    // An untouched row keeps its provenance. A changed one now carries this
    // grant — including a comp layered on a live subscription, which is what
    // stops the subscription's next renewal from cutting a lifetime comp
    // short (see grantOrExtendMembership's lifetime-comp guard).
    source: unchanged ? existing.grantSource : req.source,
    keptHigherTier,
    keptLongerDate,
    activeSubscription,
  };
}

export type MembershipGrantDeps = {
  readMembership(customerId: number): Promise<ExistingMembership | null>;
  /** INSERT ... ON CONFLICT DO NOTHING — false when a row appeared first. */
  insertMembership(customerId: number, plan: MembershipGrantPlan): Promise<boolean>;
  /** UPDATE ... WHERE row version = expectedVersion — false when it moved. */
  updateMembership(customerId: number, expectedVersion: string, plan: MembershipGrantPlan): Promise<boolean>;
};

export type MembershipGrantResult = {
  plan: MembershipGrantPlan;
  before: ExistingMembership | null;
  /** True for exactly one of any set of concurrent identical grants — the
   * caller's once-only claim for the notification email. */
  changed: boolean;
};

const MAX_GRANT_ATTEMPTS = 3;

/**
 * Read → plan → compare-and-set, retried when another writer got there first.
 * Not a blind upsert: a webhook renewal or a second admin run can land
 * between the read and the write, and planning against a row that has since
 * moved is exactly how a stale plan would shorten a date or drop a tier.
 */
export async function applyMembershipGrant(
  deps: MembershipGrantDeps,
  customerId: number,
  req: MembershipGrantRequest,
  now: Date = new Date()
): Promise<MembershipGrantResult> {
  for (let attempt = 0; attempt < MAX_GRANT_ATTEMPTS; attempt++) {
    const before = await deps.readMembership(customerId);
    const plan = planMembershipGrant(before, req, now);
    if (plan.action === "unchanged") return { plan, before, changed: false };
    const wrote = before
      ? await deps.updateMembership(customerId, before.version, plan)
      : await deps.insertMembership(customerId, plan);
    if (wrote) return { plan, before, changed: true };
  }
  throw new Error(
    `membership grant for customer ${customerId} lost the write race ${MAX_GRANT_ATTEMPTS} times — re-run it; the grant is idempotent`
  );
}

/** `months` calendar months after `from`, in UTC, clamped to the target
 * month's last day (Jan 31 + 1 → Feb 28/29, never Mar 3). */
export function addMonthsUTC(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}
