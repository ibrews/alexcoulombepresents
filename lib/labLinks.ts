// /lab's constellation layout: its own slots and its own tier mix.
//
// CLIENT-SAFE, like lib/heroLinks.ts. The pool it is dealt from is assembled
// server-side in lib/labLinkPool.ts and handed to ParticleField as a prop.
//
// ── Why /lab does not reuse heroSlots ────────────────────────────────────
// The homepage hero is 828px tall and its obstacle is a portrait cutout pinned
// to one corner, so slots can live along all four edges. /lab's field is a
// 393px band behind the page's opening copy, and the obstacle is the copy
// itself — a column pinned to the left of the content box. Reusing heroSlots
// here puts the whole `floor` band (h - inset, insets 46–83) at y 310–347,
// which is the middle of the headline. Measured 2026-08-13 against the running
// page (see docs/perf/hero-field.md):
//
//   viewport 1440x900   canvas 1440x393 @ y128   h1 box 164–932   left gutter 164
//   viewport 1024x800   canvas 1024x393 @ y128   h1 box  20–788   left gutter  20
//
// So the free space is the two margins beside that column, and only the RIGHT
// one survives at 1024 — the left margin there is the section's 20px padding.
// Hence side bands only, and insets chosen to fit inside the NARROWER of the
// two measured gutters. The layer drops a band whose gutter cannot hold a node
// (see NODE_REACH in lib/linkNodes.ts), so 1024 renders the right strand alone
// rather than stacking nine nodes on top of the headline.

import type { HeroSlot, HeroTier } from "@/lib/heroLinks";

/**
 * Nine hand-placed spots, all in the margins either side of the copy.
 *
 * `along` stays inside [0.10, 0.90] so a node's drift plus its hit-target
 * never leaves the 393px band — the field sits inside an `overflow-hidden`
 * section, and a clipped half-dot reads as a rendering bug.
 *
 * Insets are the distance into the margin from the canvas edge, and every one
 * of them is checked against NODE_REACH at both measured widths by
 * tests/lab-links.test.ts. The widest (150) still clears the h1 at 1024 by
 * 28px; the deepest left-hand one (104) stays 2px inside the 1440 margin.
 */
export const labSlots: HeroSlot[] = [
  // Left margin — present at 1440, dropped at 1024.
  { band: "left", along: 0.12, inset: 96 },
  { band: "left", along: 0.38, inset: 74 },
  { band: "left", along: 0.63, inset: 104 },
  { band: "left", along: 0.88, inset: 80 },
  // Right margin — the wide one, and the only one that survives at 1024.
  { band: "right", along: 0.11, inset: 132 },
  { band: "right", along: 0.29, inset: 96 },
  { band: "right", along: 0.47, inset: 150 },
  { band: "right", along: 0.68, inset: 104 },
  { band: "right", along: 0.88, inset: 126 },
];

/**
 * The mix, weighted to the page you are standing on: mostly Lab products,
 * a couple of repos, one way out. Must sum to labSlots.length.
 */
export const LAB_TIER_QUOTA: Record<HeroTier, number> = {
  primary: 2,
  section: 2,
  deep: 4,
  external: 1,
};

/**
 * Below this the margins are the section's own padding and there is nowhere
 * honest to put a node — the band filter in LinkNodeLayer.resize() reaches the
 * same verdict from the gutters, but gating here keeps phones from paying for
 * the measurement at all.
 */
export const LAB_LINK_MIN_W = 900;
export const LAB_LINK_MIN_H = 300;
