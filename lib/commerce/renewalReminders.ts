// ── Membership renewal reminders — pure decision logic ──────────────────────
// Warns an active member before their subscription renews, so a price change
// (a promotional Stripe coupon expiring, or a base-price change Alex makes
// directly on their subscription) never lands as a surprise charge. Driven by
// /api/cron/membership-renewal-reminders, once daily. Same split as
// memberLicensing.ts/membershipBilling.ts: no runtime imports, so "who's due
// a reminder and when" is unit-testable with no database or network.

import type { MembershipTierId } from "./membershipBilling";

export type ReminderKind = "7d" | "1d";

// Days-before-renewal each reminder fires at, largest first.
export const REMINDER_WINDOWS: { kind: ReminderKind; daysOut: number }[] = [
  { kind: "7d", daysOut: 7 },
  { kind: "1d", daysOut: 1 },
];

export type MembershipRenewalTarget = {
  customerId: number;
  email: string;
  name: string | null;
  tier: MembershipTierId;
  updatesUntil: Date;
  // Null for a member with no Stripe customer on file yet (shouldn't happen
  // in practice, but the type says what it says) — sendReminder must degrade
  // gracefully rather than assume this is always present.
  stripeCustomerId: string | null;
};

export type RenewalReminderDeps = {
  // Every currently-active member with a real paid-through date.
  activeMemberships(): Promise<MembershipRenewalTarget[]>;
  // Atomically claims the (customer, cycle, kind) reminder slot — true only
  // for the call that should actually send; a repeat claim (retry, or a
  // second cron run landing on the same day) returns false so nothing
  // double-sends.
  claimReminder(customerId: number, updatesUntil: Date, kind: ReminderKind): Promise<boolean>;
  // Stripe's actual upcoming-invoice amount for this customer — the only
  // source that's automatically correct whether or not their subscription's
  // price has been changed since they joined, and whether any promotional
  // coupon on it is still active or has expired. Null on any failure (no
  // active subscription found, API error); the sender must degrade the copy
  // gracefully rather than invent a number.
  fetchUpcomingRenewalAmountCents(stripeCustomerId: string): Promise<number | null>;
  sendReminder(input: {
    email: string;
    name: string | null;
    tier: MembershipTierId;
    kind: ReminderKind;
    renewalDate: Date;
    renewalAmountCents: number | null;
  }): Promise<void>;
};

export type ReminderResult = { customerId: number; email: string; kind: ReminderKind };

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(updatesUntil: Date, now: Date): number {
  return Math.ceil((updatesUntil.getTime() - now.getTime()) / DAY_MS);
}

/**
 * Fires any reminder whose window has been ENTERED (days-remaining <=
 * daysOut) and hasn't already been claimed for this billing cycle — not
 * "exactly on" the target day. That's deliberate: a cron outage that skips a
 * day still catches up on the next run instead of silently dropping that
 * member's warning. The 7d and 1d slots are claimed independently, so
 * catching up on both in one run (a multi-day outage) is possible but
 * harmless — it can never double-send the SAME slot twice, only widen how
 * late a slot might land relative to its target day.
 *
 * A membership already renewed or lapsed (updatesUntil in the past) is
 * skipped — nothing to warn about; that's the webhook's own territory. One
 * more than 7 days out is skipped too — not due yet.
 */
export async function sendDueRenewalReminders(
  deps: RenewalReminderDeps,
  now: Date = new Date()
): Promise<ReminderResult[]> {
  const targets = await deps.activeMemberships();
  const results: ReminderResult[] = [];

  for (const target of targets) {
    const remaining = daysUntil(target.updatesUntil, now);
    if (remaining <= 0) continue;

    for (const { kind, daysOut } of REMINDER_WINDOWS) {
      if (remaining > daysOut) continue;
      const claimed = await deps.claimReminder(target.customerId, target.updatesUntil, kind);
      if (!claimed) continue;

      const renewalAmountCents = target.stripeCustomerId
        ? await deps.fetchUpcomingRenewalAmountCents(target.stripeCustomerId)
        : null;
      await deps.sendReminder({
        email: target.email,
        name: target.name,
        tier: target.tier,
        kind,
        renewalDate: target.updatesUntil,
        renewalAmountCents,
      });
      results.push({ customerId: target.customerId, email: target.email, kind });
    }
  }
  return results;
}
