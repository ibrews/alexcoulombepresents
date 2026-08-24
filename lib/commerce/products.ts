// ── Commerce core — digital-license SKU catalog ─────────────────────────────
// Separate from lib/store.ts (the existing course/skill catalog with manual
// fulfillment). This catalog is for SKUs fulfilled by the automated
// license-key + R2-download path: checkout → webhook → entitlement → email.

export type DigitalProduct = {
  sku: string;
  name: string;
  tier: "indie";
  /** Storefront badge — defaults to "Pipeline" if omitted, matching the
   * section's original single-product assumption. Set explicitly once the
   * catalog holds more than one kind of thing. */
  kind?: string;
  priceCents: number; // TODO(alex): real launch price
  blurb: string;
  majorVersion: number;
  updatesWindowDays: number; // entitlement's updates_until = purchase + N days
  /** Exactly one of r2Prefix / npmPackage is set — they're two different
   * fulfillment shapes, not two optional extras on the same one. r2Prefix:
   * "download a file" (e.g. "mh-godot-pipeline/1.0.0/mh-godot-pipeline-1.0.0.zip").
   * npmPackage: "install a CLI" (e.g. "xrsim") — /account and /api/download
   * both branch on which one is present to show the right instructions. */
  r2Prefix?: string;
  npmPackage?: string;
};

export const DIGITAL_LIVE = process.env.NEXT_PUBLIC_DIGITAL_STORE_LIVE === "1";

export const digitalProducts: DigitalProduct[] = [
  {
    sku: "mh-godot-pipeline",
    name: "MetaHuman → Godot Pipeline (Full)",
    tier: "indie",
    priceCents: 14900, // TODO(alex): set real launch price
    blurb:
      "The complete UE → Blender → Godot 4.6 workflow: scripts, docs, shaders, and the regression harness. Bring your own MetaHuman.",
    majorVersion: 1,
    updatesWindowDays: 365,
    r2Prefix: "mh-godot-pipeline/1.0.0/mh-godot-pipeline-1.0.0.zip",
  },
  {
    sku: "drainspotting",
    name: "Drainspotting",
    tier: "indie",
    kind: "Mac app",
    priceCents: 1900, // post-launch price, set 2026-08-24 (launch week was 1400)
    blurb:
      "Reads your Mac's own power log and explains exactly what drained your battery, which app blocked sleep, and what woke it overnight. Local-only, completely private, no data sharing.",
    majorVersion: 1,
    updatesWindowDays: 365,
    r2Prefix: "drainspotting/1.0.2/Drainspotting-1.0.2.dmg",
  },
  {
    sku: "xrsim",
    name: "xrsim",
    tier: "indie",
    kind: "CLI",
    priceCents: 2000, // launch price, set 2026-08-10 (was a 9900 placeholder)
    blurb:
      "Test VR apps without a headset — drive a live simulated cockpit or run a real standalone Android APK on a local GPU-accelerated emulator. Scriptable, agent-drivable, verified end-to-end. Free for active members.",
    majorVersion: 1,
    updatesWindowDays: 36_500, // ~100 years: a paid xrsim license is meant to never expire. xrsim's own CLI
    // license check (github.com/ibrews/xrsim) doesn't actually look at updates_until for a "paid"-tier
    // key at all (any validly-signed paid key = permanent access) — this field is set generously long
    // mainly so it reads correctly here on /account ("updates until <date>") rather than gating anything.
    npmPackage: "xrsim",
  },
  // UnRealityKit Bridge intentionally NOT listed here yet — per Alex
  // (2026-07-16) it isn't a product yet. lib/store.ts's "coming soon" /
  // notify-me entry is the only listing until this one is un-commented for a
  // real launch. Don't re-add without removing that entry first (see the
  // stale-duplicate-listing note there) — the two must never both be live.
];

export function findDigitalProduct(sku: string): DigitalProduct | undefined {
  return digitalProducts.find((p) => p.sku === sku);
}
