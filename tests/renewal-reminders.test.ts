// ── Membership renewal reminder tests ───────────────────────────────────────
// lib/commerce/renewalReminders.ts has no runtime imports, so these exercise
// the real "who's due, and when" logic against fake deps — no database, no
// network.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sendDueRenewalReminders,
  type RenewalReminderDeps,
  type MembershipRenewalTarget,
  type ReminderKind,
} from "../lib/commerce/renewalReminders.ts";

const NOW = new Date("2026-08-31T14:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * DAY_MS);

type ClaimCall = { customerId: number; updatesUntil: Date; kind: ReminderKind };
type SendCall = Parameters<RenewalReminderDeps["sendReminder"]>[0];

function fakeDeps(
  targets: MembershipRenewalTarget[],
  overrides: Partial<RenewalReminderDeps> = {}
) {
  const claimCalls: ClaimCall[] = [];
  const sendCalls: SendCall[] = [];
  const claimed = new Set<string>(); // pre-seed to simulate "already sent"

  const deps: RenewalReminderDeps = {
    activeMemberships: async () => targets,
    claimReminder: async (customerId, updatesUntil, kind) => {
      claimCalls.push({ customerId, updatesUntil, kind });
      const key = `${customerId}:${updatesUntil.toISOString()}:${kind}`;
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
    fetchUpcomingRenewalAmountCents: async () => 35000,
    sendReminder: async (input) => {
      sendCalls.push(input);
    },
    ...overrides,
  };
  return { deps, claimCalls, sendCalls, claimed };
}

function member(overrides: Partial<MembershipRenewalTarget> = {}): MembershipRenewalTarget {
  return {
    customerId: 1,
    email: "member@example.com",
    name: "Mem Ber",
    tier: "unlimited",
    updatesUntil: daysFromNow(7),
    stripeCustomerId: "cus_test123",
    ...overrides,
  };
}

test("a membership renewing in exactly 7 days gets the 7d reminder", async () => {
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(7) })]);
  const result = await sendDueRenewalReminders(deps, NOW);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, "7d");
  assert.equal(sendCalls.length, 1);
  assert.equal(sendCalls[0].renewalAmountCents, 35000);
});

test("a membership renewing tomorrow gets only the 1d reminder once the 7d one is already claimed", async () => {
  // Realistic ongoing-operation shape: the 7d reminder went out 6 days ago
  // (already claimed for this cycle) — today only the 1d slot is new.
  const target = member({ updatesUntil: daysFromNow(1) });
  const { deps, claimed, sendCalls } = fakeDeps([target]);
  claimed.add(`${target.customerId}:${target.updatesUntil.toISOString()}:7d`);
  const results = await sendDueRenewalReminders(deps, NOW);
  assert.equal(results.length, 1);
  assert.equal(results[0].kind, "1d");
  assert.equal(sendCalls.length, 1);
});

test("a membership renewing in 3 days, seen for the first time, catches up on the 7d reminder (not yet the 1d one)", async () => {
  // First-ever evaluation of this target (e.g. right after this feature
  // ships) with no prior claims — the 7d window was already entered 4 days
  // ago and, having never been claimed, fires now rather than being lost.
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(3) })]);
  const results = await sendDueRenewalReminders(deps, NOW);
  assert.equal(results.length, 1);
  assert.equal(results[0].kind, "7d");
  assert.equal(sendCalls.length, 1);
});

test("a membership renewing in 10 days gets nothing — outside every window", async () => {
  const { deps } = fakeDeps([member({ updatesUntil: daysFromNow(10) })]);
  const results = await sendDueRenewalReminders(deps, NOW);
  assert.equal(results.length, 0);
});

test("already lapsed/renewed (updatesUntil in the past) is skipped entirely", async () => {
  const { deps } = fakeDeps([member({ updatesUntil: daysFromNow(-1) })]);
  const results = await sendDueRenewalReminders(deps, NOW);
  assert.equal(results.length, 0);
});

test("a second run the same day does not double-send (claim already taken)", async () => {
  const target = member({ updatesUntil: daysFromNow(7) });
  const { deps, sendCalls } = fakeDeps([target]);
  await sendDueRenewalReminders(deps, NOW);
  await sendDueRenewalReminders(deps, NOW); // simulates a retried/re-fired cron run
  assert.equal(sendCalls.length, 1);
});

test("a cron outage that skips the 7d day still catches up once it's within 7 days", async () => {
  // Renewal is 5 days out — the 7d window opened 2 days ago and was never
  // claimed (simulating a missed run). The 1d window hasn't opened yet.
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(5) })]);
  const results = await sendDueRenewalReminders(deps, NOW);
  assert.equal(results.length, 1);
  assert.equal(results[0].kind, "7d");
  assert.equal(sendCalls.length, 1);
});

test("a long outage catches up on BOTH the 7d and 1d slots in one run — never a duplicate of either slot", async () => {
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(1) })]);
  const results = await sendDueRenewalReminders(deps, NOW);
  const kinds = results.map((r) => r.kind).sort();
  assert.deepEqual(kinds, ["1d", "7d"]);
  assert.equal(sendCalls.length, 2);
});

test("no stripeCustomerId on file → renewalAmountCents is null, not fetched", async () => {
  let fetchCalled = false;
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(1), stripeCustomerId: null })], {
    fetchUpcomingRenewalAmountCents: async () => {
      fetchCalled = true;
      return 20000;
    },
  });
  await sendDueRenewalReminders(deps, NOW);
  assert.equal(fetchCalled, false);
  assert.equal(sendCalls[0].renewalAmountCents, null);
});

test("a failed Stripe lookup degrades to null rather than throwing", async () => {
  const { deps, sendCalls } = fakeDeps([member({ updatesUntil: daysFromNow(1) })], {
    fetchUpcomingRenewalAmountCents: async () => null,
  });
  await sendDueRenewalReminders(deps, NOW);
  assert.equal(sendCalls[0].renewalAmountCents, null);
});

test("multiple members are each evaluated independently", async () => {
  const { deps, sendCalls } = fakeDeps([
    member({ customerId: 1, email: "a@example.com", updatesUntil: daysFromNow(7) }),
    member({ customerId: 2, email: "b@example.com", updatesUntil: daysFromNow(20) }),
    member({ customerId: 3, email: "c@example.com", updatesUntil: daysFromNow(1) }),
  ]);
  await sendDueRenewalReminders(deps, NOW);
  // b (20 days out) gets nothing; a (exactly 7 days out, first time seen)
  // gets one 7d send; c (1 day out, first time seen) catches up on BOTH
  // slots at once — see the dedicated catch-up test above for why that's
  // correct rather than a bug.
  const contacted = new Set(sendCalls.map((c) => c.email));
  assert.deepEqual([...contacted].sort(), ["a@example.com", "c@example.com"]);
  assert.equal(sendCalls.filter((c) => c.email === "a@example.com").length, 1);
  assert.equal(sendCalls.filter((c) => c.email === "c@example.com").length, 2);
});
