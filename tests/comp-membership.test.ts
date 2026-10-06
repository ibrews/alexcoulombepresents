// ── Comped membership tests ─────────────────────────────────────────────────
// Merge rules (membershipGrants.ts), the admin orchestration
// (compMembership.ts), the email copy, and the renewal-reminder exclusion —
// all against fake deps. No database, no Resend, no Zoom.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMonthsUTC,
  applyMembershipGrant,
  planMembershipGrant,
  type ExistingMembership,
  type MembershipGrantDeps,
  type MembershipGrantPlan,
} from "../lib/commerce/membershipGrants.ts";
import { parseCompRequest, runCompMembership, type CompDeps, type CompRequest } from "../lib/commerce/compMembership.ts";
import { INSTRUCTOR_GIFT_SUBJECT, renderGiftedMembershipEmail } from "../lib/commerce/giftEmailCopy.ts";
import { sendDueRenewalReminders, type RenewalReminderDeps } from "../lib/commerce/renewalReminders.ts";

const NOW = new Date("2026-10-06T15:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY);

function row(overrides: Partial<ExistingMembership> = {}): ExistingMembership {
  return {
    tier: "starter",
    status: "active",
    updatesUntil: inDays(20),
    grantSource: null,
    version: "100",
    ...overrides,
  };
}

// ── planMembershipGrant: the merge rules ────────────────────────────────────

test("lifetime comp on a brand-new customer inserts a lifetime row tagged 'comp'", () => {
  const plan = planMembershipGrant(null, { tier: "insider", until: null, source: "comp" }, NOW);
  assert.equal(plan.action, "insert");
  assert.equal(plan.tier, "insider");
  assert.equal(plan.until, null);
  assert.equal(plan.source, "comp");
});

test("lifetime comp over a dated membership makes it lifetime and upgrades the tier", () => {
  const plan = planMembershipGrant(row({ tier: "starter" }), { tier: "insider", until: null, source: "comp" }, NOW);
  assert.equal(plan.action, "extend");
  assert.equal(plan.tier, "insider");
  assert.equal(plan.until, null);
  assert.equal(plan.source, "comp");
});

test("never shortens: a shorter grant keeps the existing later date", () => {
  const plan = planMembershipGrant(
    row({ tier: "unlimited", updatesUntil: inDays(90), grantSource: "gift" }),
    { tier: "unlimited", until: inDays(30), source: "gift" },
    NOW
  );
  assert.equal(plan.action, "unchanged");
  assert.equal(plan.until?.getTime(), inDays(90).getTime());
  assert.equal(plan.keptLongerDate, true);
});

test("never shortens a lifetime membership, even with a dated higher-tier grant", () => {
  const plan = planMembershipGrant(
    row({ tier: "insider", updatesUntil: null, grantSource: "comp" }),
    { tier: "insider", until: inDays(30), source: "gift" },
    NOW
  );
  assert.equal(plan.action, "unchanged");
  assert.equal(plan.until, null);
});

test("never downgrades: a lower-tier grant keeps the higher tier but can still extend the date", () => {
  const plan = planMembershipGrant(
    row({ tier: "insider", updatesUntil: inDays(10), grantSource: "gift" }),
    { tier: "starter", until: inDays(60), source: "gift" },
    NOW
  );
  assert.equal(plan.action, "extend");
  assert.equal(plan.tier, "insider");
  assert.equal(plan.keptHigherTier, true);
  assert.equal(plan.until?.getTime(), inDays(60).getTime());
});

test("a lapsed or revoked row is a fresh start, not something to merge with", () => {
  const lapsed = planMembershipGrant(
    row({ tier: "insider", updatesUntil: inDays(-5) }),
    { tier: "starter", until: inDays(30), source: "gift" },
    NOW
  );
  assert.equal(lapsed.action, "reactivate");
  assert.equal(lapsed.tier, "starter");
  assert.equal(lapsed.until?.getTime(), inDays(30).getTime());

  // A cancellation leaves updates_until in the future — it must not be honored.
  const revoked = planMembershipGrant(
    row({ tier: "insider", status: "revoked", updatesUntil: inDays(25) }),
    { tier: "starter", until: inDays(5), source: "gift" },
    NOW
  );
  assert.equal(revoked.action, "reactivate");
  assert.equal(revoked.tier, "starter");
  assert.equal(revoked.until?.getTime(), inDays(5).getTime());
});

test("comping someone with a live paid subscription flags it so the caller can warn", () => {
  const plan = planMembershipGrant(row({ grantSource: null }), { tier: "insider", until: null, source: "comp" }, NOW);
  assert.equal(plan.activeSubscription, true);
  assert.equal(plan.source, "comp");
});

// ── applyMembershipGrant: compare-and-set ───────────────────────────────────

function memoryStore(initial: ExistingMembership | null) {
  let current = initial;
  let version = 100;
  const writes: MembershipGrantPlan[] = [];
  const deps: MembershipGrantDeps = {
    readMembership: async () => (current ? { ...current } : null),
    insertMembership: async (_id, plan) => {
      if (current) return false;
      writes.push(plan);
      current = { tier: plan.tier, status: "active", updatesUntil: plan.until, grantSource: plan.source, version: String(++version) };
      return true;
    },
    updateMembership: async (_id, expected, plan) => {
      if (!current || current.version !== expected) return false;
      writes.push(plan);
      current = { tier: plan.tier, status: "active", updatesUntil: plan.until, grantSource: plan.source, version: String(++version) };
      return true;
    },
  };
  return { deps, writes, get: () => current, bump: (next: ExistingMembership) => (current = next) };
}

test("re-running the same comp changes nothing the second time", async () => {
  const store = memoryStore(null);
  const first = await applyMembershipGrant(store.deps, 7, { tier: "insider", until: null, source: "comp" }, NOW);
  const second = await applyMembershipGrant(store.deps, 7, { tier: "insider", until: null, source: "comp" }, NOW);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.equal(store.writes.length, 1, "one row written, never duplicated");
});

test("a write that loses a race re-reads and re-plans instead of clobbering", async () => {
  const store = memoryStore(row({ tier: "starter", updatesUntil: inDays(10) }));
  let raced = false;
  const deps: MembershipGrantDeps = {
    ...store.deps,
    updateMembership: async (id, expected, plan) => {
      if (!raced) {
        // A renewal lands between our read and our write, extending the date.
        raced = true;
        store.bump(row({ tier: "unlimited", updatesUntil: inDays(200), version: "555" }));
      }
      return store.deps.updateMembership(id, expected, plan);
    },
  };
  const result = await applyMembershipGrant(deps, 7, { tier: "starter", until: inDays(30), source: "gift" }, NOW);
  // Re-planned against the renewal: no downgrade, no shortening → unchanged.
  assert.equal(result.changed, false);
  assert.equal(store.get()?.tier, "unlimited");
  assert.equal(store.get()?.updatesUntil?.getTime(), inDays(200).getTime());
});

test("addMonthsUTC clamps to the end of a shorter month", () => {
  assert.equal(addMonthsUTC(new Date("2026-01-31T12:00:00Z"), 1).toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(addMonthsUTC(new Date("2026-11-15T00:00:00Z"), 3).toISOString(), "2027-02-15T00:00:00.000Z");
});

// ── runCompMembership: the admin endpoint ───────────────────────────────────

type Call = { fn: string; args: unknown[] };

function compSetup(opts: { existingCustomer?: number | null; existingRow?: ExistingMembership | null } = {}) {
  const calls: Call[] = [];
  const store = memoryStore(opts.existingRow ?? null);
  const log = (fn: string, ...args: unknown[]) => calls.push({ fn, args });
  let customerId = opts.existingCustomer ?? null;
  const deps: CompDeps = {
    findCustomerIdByEmail: async (email) => {
      log("findCustomerIdByEmail", email);
      return customerId;
    },
    readMembership: async (id) => {
      log("readMembership", id);
      return store.deps.readMembership(id);
    },
    findOrCreateCustomer: async (email, name) => {
      log("findOrCreateCustomer", email, name);
      customerId = 42;
      return 42;
    },
    grantCompMembership: async (id, tier, until, source) => {
      log("grantCompMembership", id, tier, until, source);
      return applyMembershipGrant(store.deps, id, { tier, until, source }, NOW);
    },
    issueMagicLinkUrl: async (id) => {
      log("issueMagicLinkUrl", id);
      return "https://example.test/verify?token=abc";
    },
    renderEmail: (input) =>
      renderGiftedMembershipEmail({
        variant: "instructor",
        recipientName: input.name,
        tier: { name: "Insider", benefits: ["Everything in Unlimited", "10x vote weight"], monthlyCredits: "unlimited" },
        topTier: true,
        until: input.until,
        magicLinkUrl: input.magicLinkUrl,
      }),
    sendEmail: async (input) => {
      log("sendEmail", input);
    },
    inviteToUpcomingSessions: async (email) => {
      log("invite", email);
      return { ok: true };
    },
    now: () => NOW,
  };
  const req = (overrides: Record<string, unknown> = {}): CompRequest => {
    const parsed = parseCompRequest({ email: "instructor@example.com", name: "Jane Doe", ...overrides });
    if (!parsed.ok) throw new Error(parsed.error);
    return parsed.req;
  };
  const called = (fn: string) => calls.filter((c) => c.fn === fn);
  return { deps, req, calls, called, store };
}

test("defaults: lifetime Insider, email + invites on, reason instructor", () => {
  const parsed = parseCompRequest({ email: "instructor@example.com" });
  assert.ok(parsed.ok);
  assert.equal(parsed.req.tier, "insider");
  assert.equal(parsed.req.months, null);
  assert.equal(parsed.req.sendEmail, true);
  assert.equal(parsed.req.reason, "instructor");
});

test("request validation: bad email, unknown tier, lifetime+months together", () => {
  assert.equal(parseCompRequest({ email: "nope" }).ok, false);
  assert.equal(parseCompRequest({ email: "a@b.co", tier: "platinum" }).ok, false);
  assert.equal(parseCompRequest({ email: "a@b.co", lifetime: true, months: 3 }).ok, false);
  const term = parseCompRequest({ email: "a@b.co", months: 3 });
  assert.ok(term.ok && term.req.months === 3);
});

test("comp grants lifetime Insider, emails the magic link, and invites to upcoming sessions", async () => {
  const { deps, req, called, store } = compSetup();
  const result = await runCompMembership(deps, req());
  assert.equal(result.ok, true);
  assert.equal(result.grant.action, "insert");
  assert.equal(result.grant.until, null);
  assert.deepEqual(called("grantCompMembership")[0].args, [42, "insider", null, "comp"]);
  assert.equal(store.get()?.grantSource, "comp");
  assert.equal(result.notification.sent, true);
  assert.equal((called("sendEmail")[0].args[0] as { magicLinkUrl: string }).magicLinkUrl, "https://example.test/verify?token=abc");
  assert.deepEqual(called("invite")[0].args, ["instructor@example.com"]);
});

test("re-running for the same email changes nothing and sends nothing", async () => {
  const { deps, req, called } = compSetup();
  await runCompMembership(deps, req());
  const again = await runCompMembership(deps, req());
  assert.equal(again.grant.changed, false);
  assert.equal(again.notification.sent, false);
  assert.match(again.notification.skipped ?? "", /force/);
  assert.equal(called("sendEmail").length, 1, "no second email");
  assert.equal(called("invite").length, 1, "no second invite sweep");
  assert.equal(called("findOrCreateCustomer").length, 1, "second run found the existing customer");
});

test("force:true re-sends the email and invites without touching the grant", async () => {
  const { deps, req, called, store } = compSetup();
  await runCompMembership(deps, req());
  const writesBefore = store.writes.length;
  const forced = await runCompMembership(deps, req({ force: true }));
  assert.equal(forced.notification.sent, true);
  assert.equal(called("sendEmail").length, 2);
  assert.equal(store.writes.length, writesBefore, "force never rewrites the row");
});

test("dryRun touches nothing: no customer, no grant, no magic link, no email, no invites", async () => {
  const { deps, req, called, store } = compSetup();
  const result = await runCompMembership(deps, req({ dryRun: true }));
  assert.equal(result.dryRun, true);
  assert.equal(result.grant.action, "insert");
  assert.equal(result.customer.existed, false);
  assert.equal(result.notification.subject, INSTRUCTOR_GIFT_SUBJECT);
  assert.match(result.notification.text ?? "", /lifetime Insider membership/);
  for (const write of ["findOrCreateCustomer", "grantCompMembership", "issueMagicLinkUrl", "sendEmail", "invite"]) {
    assert.equal(called(write).length, 0, `${write} must not run on a dry run`);
  }
  assert.equal(store.writes.length, 0);
  assert.equal(store.get(), null);
});

test("dryRun on someone who already has it reports that nothing would change", async () => {
  const { deps, req } = compSetup({
    existingCustomer: 9,
    existingRow: row({ tier: "insider", updatesUntil: null, grantSource: "comp" }),
  });
  const result = await runCompMembership(deps, req({ dryRun: true }));
  assert.equal(result.grant.action, "unchanged");
  assert.match(result.notification.skipped ?? "", /nothing would change/);
});

test("an email failure doesn't undo the grant and says how to retry", async () => {
  const { deps, req, store, called } = compSetup();
  deps.sendEmail = async () => {
    throw new Error("resend 500");
  };
  const result = await runCompMembership(deps, req());
  assert.equal(result.ok, false);
  assert.equal(store.get()?.updatesUntil, null, "grant is saved");
  assert.match(result.notification.error ?? "", /force:true/);
  assert.equal(called("invite").length, 1, "invites still run");
});

test("an invite failure is reported, never thrown", async () => {
  const { deps, req } = compSetup();
  deps.inviteToUpcomingSessions = async () => {
    throw new Error("zoom down");
  };
  const result = await runCompMembership(deps, req());
  assert.equal(result.ok, true);
  assert.equal(result.invites.ok, false);
  assert.match(result.invites.error ?? "", /zoom down/);
});

test("comping a live subscriber warns that Stripe keeps billing", async () => {
  const { deps, req } = compSetup({ existingCustomer: 9, existingRow: row({ grantSource: null }) });
  const result = await runCompMembership(deps, req());
  assert.ok(result.warnings.some((w) => /keeps billing/.test(w)));
});

// ── Email copy ──────────────────────────────────────────────────────────────

test("instructor email: exact subject, thanks for teaching, tier benefits, lifetime, invites, magic link", () => {
  const benefits = ["Everything in Unlimited", "Early access to in-progress tools", "10x vote weight"];
  const { subject, text } = renderGiftedMembershipEmail({
    variant: "instructor",
    recipientName: "Jane Doe",
    tier: { name: "Insider", benefits, monthlyCredits: "unlimited" },
    topTier: true,
    until: null,
    magicLinkUrl: "https://example.test/verify?token=xyz",
    gumroad: { code: "CODE123", url: "https://example.test/gumroad" },
  });
  assert.equal(subject, "You've been gifted a membership to Alex Coulombe Presents!");
  assert.match(text, /^Hi Jane,/);
  assert.match(text, /Thank you for teaching/);
  assert.match(text, /Insider is the top tier/);
  assert.match(text, /It never expires/);
  for (const b of benefits) assert.ok(text.includes(`• ${b}`), `benefit listed: ${b}`);
  assert.match(text, /Zoom invite to every upcoming class and to office hours automatically/);
  assert.ok(text.includes("https://example.test/verify?token=xyz"));
  assert.ok(text.includes("CODE123"));
  assert.doesNotMatch(text, /Nothing renews/, "lifetime has no end-date copy");
});

test("gift variant: from line, personal message, end date, no renewal", () => {
  const { subject, text } = renderGiftedMembershipEmail({
    variant: "gift",
    recipientName: "Sam",
    tier: { name: "Starter", benefits: ["Every class recording"], monthlyCredits: 3 },
    until: new Date("2027-01-06T15:00:00Z"),
    months: 3,
    credits: 9,
    fromName: "Pat",
    message: "Happy birthday!\nGo build something.",
    magicLinkUrl: "https://example.test/verify?token=g",
  });
  assert.equal(subject, "Pat gifted you a membership to Alex Coulombe Presents!");
  assert.match(text, /Pat just gave you a 3-month Starter membership/);
  assert.match(text, /A note from Pat:/);
  assert.match(text, /Happy birthday!\n {4}Go build something\./);
  assert.match(text, /Your 9 class credits are ready now/);
  assert.match(text, /January 6, 2027/);
  assert.match(text, /Nothing renews and nothing gets charged/);
});

// ── Renewal reminders skip comps and gifts ──────────────────────────────────

test("renewal reminders skip memberships with a grant_source (comps and gifts never renew)", async () => {
  const sent: string[] = [];
  const deps: RenewalReminderDeps = {
    activeMemberships: async () => [
      { customerId: 1, email: "payer@example.com", name: null, tier: "starter", updatesUntil: inDays(5), stripeCustomerId: "cus_1" },
      { customerId: 2, email: "gift@example.com", name: null, tier: "starter", updatesUntil: inDays(5), stripeCustomerId: null, grantSource: "gift" },
      { customerId: 3, email: "comp@example.com", name: null, tier: "insider", updatesUntil: inDays(5), stripeCustomerId: "cus_3", grantSource: "comp" },
    ],
    claimReminder: async () => true,
    fetchUpcomingRenewalAmountCents: async () => 20000,
    sendReminder: async (input) => {
      sent.push(input.email);
    },
  };
  await sendDueRenewalReminders(deps, NOW);
  assert.deepEqual(sent, ["payer@example.com"]);
});
