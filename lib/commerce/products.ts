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
  r2Prefix: string; // e.g. "mh-godot-pipeline/1.0.0/mh-godot-pipeline-1.0.0.zip"
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
    priceCents: 1400, // launch week; TODO(alex): bump to 1900 after
    blurb:
      "Reads your Mac's own power log and explains exactly what drained your battery, which app blocked sleep, and what woke it overnight. Local-only, completely private, no data sharing.",
    majorVersion: 1,
    updatesWindowDays: 365,
    r2Prefix: "drainspotting/1.0.2/Drainspotting-1.0.2.dmg",
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
