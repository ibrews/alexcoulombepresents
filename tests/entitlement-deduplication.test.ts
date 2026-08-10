// ── Account entitlement display tests ──────────────────────────────────────
// Runs on Node's built-in test runner with synthetic rows only — no database
// or browser is needed to verify the account-card selection rule.

import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeEntitlementsBySku } from "../lib/commerce/entitlementDisplay.ts";
import type { EntitlementRow } from "../lib/commerce/entitlements.ts";

function entitlement(overrides: Partial<EntitlementRow>): EntitlementRow {
  return {
    id: 1,
    sku: "xrsim",
    tier: "member",
    status: "active",
    major_version: 1,
    updates_until: "2026-09-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    key_text: "test-key",
    ...overrides,
  };
}

test("keeps a member-tier entitlement when it is the sku's only row", () => {
  const member = entitlement({ id: 1, tier: "member" });

  assert.deepEqual(dedupeEntitlementsBySku([member]), [member]);
});

test("keeps a non-member entitlement when it is the sku's only row", () => {
  const purchase = entitlement({ id: 2, tier: "indie" });

  assert.deepEqual(dedupeEntitlementsBySku([purchase]), [purchase]);
});

test("prefers a non-member purchase over a member perk for the same sku", () => {
  const member = entitlement({ id: 1, tier: "member", created_at: "2026-08-02T00:00:00.000Z" });
  const purchase = entitlement({ id: 2, tier: "indie", created_at: "2026-08-01T00:00:00.000Z" });

  assert.deepEqual(dedupeEntitlementsBySku([member, purchase]), [purchase]);
});

test("prefers an active row before considering its tier", () => {
  const revokedPurchase = entitlement({ id: 1, tier: "indie", status: "revoked" });
  const activeMember = entitlement({ id: 2, tier: "member", status: "active" });

  assert.deepEqual(dedupeEntitlementsBySku([revokedPurchase, activeMember]), [activeMember]);
});

test("keeps the most recent non-member row when duplicate purchases exist", () => {
  const earlierPurchase = entitlement({ id: 1, tier: "indie", created_at: "2026-08-01T00:00:00.000Z" });
  const laterPurchase = entitlement({ id: 2, tier: "indie", created_at: "2026-08-02T00:00:00.000Z" });

  assert.deepEqual(dedupeEntitlementsBySku([earlierPurchase, laterPurchase]), [laterPurchase]);
});

test("preserves the preferred row for each sku independently", () => {
  const xrsimMember = entitlement({ id: 1, sku: "xrsim", tier: "member" });
  const xrsimPurchase = entitlement({ id: 2, sku: "xrsim", tier: "indie" });
  const otherMember = entitlement({ id: 3, sku: "other-product", tier: "member" });

  assert.deepEqual(dedupeEntitlementsBySku([xrsimMember, xrsimPurchase, otherMember]), [xrsimPurchase, otherMember]);
});
