// ── Member-perk product licensing tests ─────────────────────────────────────
// Runs on Node's built-in test runner (node --test, type stripping — no test
// framework dependency). lib/commerce/memberLicensing.ts has no runtime
// imports, so these tests exercise the real refresh logic with fake deps —
// no database, no network. Same pattern as membership-webhook.test.ts.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  refreshMemberLicenses,
  MEMBER_LICENSE_WINDOW_DAYS,
  type MemberLicensingDeps,
  type MemberLicenseTarget,
} from "../lib/commerce/memberLicensing.ts";

type Call = { customerId: number; email: string; sku: string; majorVersion: number; updatesUntil: Date };

function fakeDeps(members: MemberLicenseTarget[]) {
  const calls: Call[] = [];
  const deps: MemberLicensingDeps = {
    activeMembers: () => Promise.resolve(members),
    grantOrRefreshMemberLicense: (customerId, email, sku, majorVersion, updatesUntil) => {
      calls.push({ customerId, email, sku, majorVersion, updatesUntil });
      return Promise.resolve();
    },
  };
  return { deps, calls };
}

const NOW = new Date("2026-08-09T12:00:00.000Z");

test("refreshes every active member, one call each, with the sku/version/window it was given", async () => {
  const members: MemberLicenseTarget[] = [
    { customerId: 1, email: "a@example.com" },
    { customerId: 2, email: "b@example.com" },
  ];
  const { deps, calls } = fakeDeps(members);

  const results = await refreshMemberLicenses("xrsim", 1, deps, NOW);

  assert.equal(calls.length, 2);
  assert.deepEqual(
    results,
    members.map((m) => ({ customerId: m.customerId, email: m.email }))
  );
  for (const call of calls) {
    assert.equal(call.sku, "xrsim");
    assert.equal(call.majorVersion, 1);
  }
});

test("the window handed to grantOrRefreshMemberLicense is exactly now + MEMBER_LICENSE_WINDOW_DAYS", async () => {
  const { deps, calls } = fakeDeps([{ customerId: 1, email: "a@example.com" }]);
  await refreshMemberLicenses("xrsim", 1, deps, NOW);

  const expected = new Date(NOW.getTime() + MEMBER_LICENSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  assert.equal(calls[0].updatesUntil.getTime(), expected.getTime());
});

test("no active members means no calls and an empty result", async () => {
  const { deps, calls } = fakeDeps([]);
  const results = await refreshMemberLicenses("xrsim", 1, deps, NOW);
  assert.equal(calls.length, 0);
  assert.deepEqual(results, []);
});

test("a lapsed member simply stops appearing in activeMembers, so they're skipped without any explicit revoke call", async () => {
  // There is no "revoke" branch in this module by design — see
  // memberLicensing.ts's header comment. This test documents that omission:
  // refreshMemberLicenses only ever calls grantOrRefreshMemberLicense for
  // whatever activeMembers() currently returns.
  const { deps, calls } = fakeDeps([{ customerId: 1, email: "still-active@example.com" }]);
  await refreshMemberLicenses("xrsim", 1, deps, NOW);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].customerId, 1);
});
