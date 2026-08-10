// /account shows one card per product. Member-perk rows are intentionally
// independent from purchased rows, so prefer the permanent purchase when both
// exist while still showing a member-only entitlement.

import type { EntitlementRow } from "./entitlements";

export function dedupeEntitlementsBySku(entitlements: EntitlementRow[]): EntitlementRow[] {
  const preferredBySku = new Map<string, EntitlementRow>();

  for (const entitlement of entitlements) {
    const current = preferredBySku.get(entitlement.sku);
    if (!current || isPreferredEntitlement(entitlement, current)) {
      preferredBySku.set(entitlement.sku, entitlement);
    }
  }

  return [...preferredBySku.values()];
}

function isPreferredEntitlement(candidate: EntitlementRow, current: EntitlementRow): boolean {
  const candidateIsActive = candidate.status === "active";
  const currentIsActive = current.status === "active";
  if (candidateIsActive !== currentIsActive) return candidateIsActive;

  const candidateIsMember = candidate.tier === "member";
  const currentIsMember = current.tier === "member";
  if (candidateIsMember !== currentIsMember) return !candidateIsMember;

  return new Date(candidate.created_at).getTime() > new Date(current.created_at).getTime();
}
