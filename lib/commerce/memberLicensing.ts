// ── Member-perk product licensing — pure decision logic ────────────────────
// Auto-issuance/renewal of a free-for-active-members product license
// (currently just xrsim) — driven by /api/cron/xrsim-member-licenses, once
// daily. All side effects (DB reads/writes, key signing) arrive via `deps`,
// so the "who gets a fresh key and what goes in it" logic is unit-testable
// with no database — same split as membershipBilling.ts: this file must stay
// free of runtime imports for that reason.
//
// Design: a member-tier license key is deliberately short-lived
// (MEMBER_LICENSE_WINDOW_DAYS) and re-signed fresh on every cron run for
// every CURRENTLY active member. Letting a lapsed member's key simply stop
// being reissued is how membership "revokes" access — the client-side
// verifier (e.g. xrsim's src/license.ts) is fully offline by design (no
// network call, ever, to check whether a key is valid — see that project's
// docs/licensing.md), so there is no way to push a live revocation to an
// already-activated key; it has to expire on its own instead.
//
// The window is 14 days — the same length as xrsim's own free trial — so a
// member who touches xrsim (or just visits /account) roughly every two weeks
// never sees a spurious "license expired" while still paying; only a
// genuinely lapsed membership goes stale, within at most ~14 days of its
// last successful cron refresh.

export const MEMBER_LICENSE_WINDOW_DAYS = 14;

export type MemberLicenseTarget = { customerId: number; email: string };

export type MemberLicensingDeps = {
  // Every customer with a currently-active membership entitlement.
  activeMembers(): Promise<MemberLicenseTarget[]>;
  // Upserts the member-tier entitlement for (customerId, sku) and stores a
  // freshly-signed license key for it, revoking whatever member-tier key
  // that customer/sku previously had.
  grantOrRefreshMemberLicense(
    customerId: number,
    email: string,
    sku: string,
    majorVersion: number,
    updatesUntil: Date
  ): Promise<void>;
};

export type RefreshResult = { customerId: number; email: string };

export async function refreshMemberLicenses(
  sku: string,
  majorVersion: number,
  deps: MemberLicensingDeps,
  now: Date = new Date()
): Promise<RefreshResult[]> {
  const members = await deps.activeMembers();
  const updatesUntil = new Date(now.getTime() + MEMBER_LICENSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const results: RefreshResult[] = [];
  for (const member of members) {
    await deps.grantOrRefreshMemberLicense(member.customerId, member.email, sku, majorVersion, updatesUntil);
    results.push({ customerId: member.customerId, email: member.email });
  }
  return results;
}
