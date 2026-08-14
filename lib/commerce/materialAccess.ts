// ── Who can open which class folder ────────────────────────────────────────
//
// One rule, used by both the pages and the download route so they can never
// disagree about what someone is allowed to see:
//
//   members            → every folder
//   individual signups → the folder whose slug they have a paid, non-refunded
//                        order for
//
// Deliberately derived from existing records rather than a new grant table.
// A refund already flips catalog_orders.refunded, and a lapsed membership
// already drops the entitlement, so access falls away on its own. Anything
// hand-maintained here would drift the first time someone refunded a class.

import { isMember } from "./membership";
import { getCustomer } from "./entitlements";
import { purchasedSlugsForEmail } from "./seats";

// canOpen()/foldersFor()/MaterialAccess are pure and live in
// lib/classMaterials.ts (see the comment there for why) — re-exported here
// so every existing importer of THIS module keeps working unchanged.
export { canOpen, foldersFor, type MaterialAccess } from "@/lib/classMaterials";
import type { MaterialAccess } from "@/lib/classMaterials";

export async function accessForCustomer(customerId: number | null): Promise<MaterialAccess> {
  if (!customerId) return { member: false, purchasedSlugs: [] };

  // Both lookups are independent — a failure in one must not silently
  // downgrade the other to "no access" for someone who paid.
  const [member, purchasedSlugs] = await Promise.all([
    isMember(customerId).catch(() => false),
    getCustomer(customerId)
      .then((c) => (c?.email ? purchasedSlugsForEmail(c.email) : []))
      .catch(() => [] as string[]),
  ]);

  return { member, purchasedSlugs };
}
