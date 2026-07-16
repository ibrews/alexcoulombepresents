// ── Commerce core — digital-license SKU catalog ─────────────────────────────
// Separate from lib/store.ts (the existing course/skill catalog with manual
// fulfillment). This catalog is for SKUs fulfilled by the automated
// license-key + R2-download path: checkout → webhook → entitlement → email.

export type DigitalProduct = {
  sku: string;
  name: string;
  tier: "indie";
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
  // UnRealityKit Bridge intentionally NOT listed here yet — per Alex
  // (2026-07-16) it isn't a product yet. lib/store.ts's "coming soon" /
  // notify-me entry is the only listing until this one is un-commented for a
  // real launch. Don't re-add without removing that entry first (see the
  // stale-duplicate-listing note there) — the two must never both be live.
];

export function findDigitalProduct(sku: string): DigitalProduct | undefined {
  return digitalProducts.find((p) => p.sku === sku);
}
