// The hero constellation's link model: tiers, slots, and the per-visit draw.
//
// This file is CLIENT-SAFE on purpose. The pool it draws from is assembled in
// lib/heroLinkPool.ts, which reads the filesystem (newsletter and curriculum
// markdown) and pulls in lib/appearances.ts — a thousand-line module nobody
// wants in the browser bundle for a decorative hero. app/page.tsx builds the
// pool on the server and hands it to FaceField as a prop.
//
// ── Slots vs links ───────────────────────────────────────────────────────
// Position and content are deliberately separate. A SLOT is a hand-tuned spot
// in the hero that is known to be clear of the nav, the headline and the
// portrait (see the band note below). A LINK is somewhere on the site. Every
// visit, links are drawn from the pool and dropped into the slots — so the
// layout stays as carefully placed as when it was hand-authored, while the
// contents change.
//
// ── Why bands and not x/y fractions ──────────────────────────────────────
// The obvious encoding — a fractional (fx, fy) per slot — was tried first and
// is wrong. The hero is `min-h-[92vh]`, so its height tracks the window while
// the things a slot must avoid do NOT: the fixed header is always 104px tall
// and the portrait cutout is pinned to the bottom-right corner. A slot at
// fy 0.17 sits comfortably below the nav on a 900px-tall window (y 141) and
// disappears *underneath* it on a 800px one (y 125, with a 44px hit-target
// whose top edge lands at 103). Measured at 1024x800 all four top-band slots
// collapsed onto a single line once clamped away from the header.
//
// So each slot is anchored to an EDGE it actually cares about, in pixels,
// and only spread along the perpendicular axis as a fraction:
//
//   band "top"    y = navBottom + inset      x = `along` across the width
//   band "floor"  y = heroBottom - inset     x = `along`, stopping at the cutout
//   band "right"  x = viewportRight - inset  y = `along` between nav and cutout
//   band "left"   x = inset                  y = `along` down the hero
//
// That holds at every size the constellation runs at, and it degrades in the
// right direction: when the cutout is hidden the floor and right bands simply
// reclaim the space it was occupying.

export type HeroBand = "top" | "right" | "left" | "floor";

/** A hand-placed position in the hero. Carries no content. */
export type HeroSlot = {
  band: HeroBand;
  /** 0–1 along the band's free axis (across for top/floor, down for left/right). */
  along: number;
  /** Distance in px from the edge this band is anchored to. */
  inset: number;
};

/**
 * How specific a destination is.
 *   primary  — the seven top-nav pages
 *   section  — the rest of the real sections (Skills, Videos, Newsletter…)
 *   deep     — one particular thing on this site: a repo, a lab project, a
 *              2015 meetup talk
 *   external — somewhere the site sends you: a talk video, a press piece, a
 *              GitHub repo. Opens in a new tab and is marked as leaving.
 */
export type HeroTier = "primary" | "section" | "deep" | "external";

export type HeroLink = {
  href: string;
  label: string;
  /** Shown under the label in the tooltip — what this is, in plain words. */
  kicker: string;
  tier: HeroTier;
};

/** A link that has been dealt into a slot. This is what the canvas layer eats. */
export type HeroNodeLink = HeroLink & HeroSlot & { hue: number };

// Fixed draw per tier, every visit — so the mix always feels the same even
// though the contents don't. Must sum to heroSlots.length.
//
// Not an even split: external is deliberately the smallest. At 3 of 12 a
// quarter of the hero led off-site, which is a lot of exit for a homepage.
// The slot it gave up went to `deep`, which is the widest pool (157) and
// where the variety actually lives.
export const TIER_QUOTA: Record<HeroTier, number> = {
  primary: 3,
  section: 3,
  deep: 4,
  external: 2,
};

// Tier is legible at a glance in the existing palette, which makes the mix
// readable rather than arbitrary: teal for the big rooms, grape for the
// sections, amber for the deep cuts, sky for anything that leaves the site.
export const TIER_HUE: Record<HeroTier, number> = {
  primary: 174,
  section: 262,
  deep: 42,
  external: 213,
};

/** Off-site links get a new tab and a marker; everything else routes normally. */
export function isExternal(link: { href: string }): boolean {
  return /^https?:\/\//.test(link.href);
}

// Twelve slots, hand-placed against the hero's measured layout. Insets leave
// room for the ~26px idle wander (WANDER_AMP in lib/linkNodes.ts) plus the
// hit-target's half-height, so a drifting node never reaches under the nav.
export const heroSlots: HeroSlot[] = [
  // Strip under the nav
  { band: "top", along: 0.11, inset: 49 },
  { band: "top", along: 0.3, inset: 41 },
  { band: "top", along: 0.47, inset: 62 },
  { band: "top", along: 0.64, inset: 44 },
  // Right shoulder, above the portrait cutout
  { band: "right", along: 0.08, inset: 101 },
  { band: "right", along: 0.32, inset: 290 },
  { band: "right", along: 0.64, inset: 201 },
  // Left margin
  { band: "left", along: 0.28, inset: 65 },
  { band: "left", along: 0.62, inset: 58 },
  // Floor, below the CTAs
  { band: "floor", along: 0.07, inset: 83 },
  { band: "floor", along: 0.34, inset: 46 },
  { band: "floor", along: 0.55, inset: 83 },
];

/** Fisher–Yates, on a copy, with an injectable source so tests are decidable. */
function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deal one fresh constellation: `TIER_QUOTA` links from each tier, shuffled
 * into `heroSlots`.
 *
 * Runs on the client at mount, never during render — the homepage is
 * statically prerendered, so a draw made while rendering would either be
 * baked identically into every visitor's HTML (no variety at all) or, if
 * re-rolled on the client, produce a hydration mismatch.
 *
 * A tier that can't fill its quota (a nearly-empty site, a filtered pool)
 * gives its remaining slots back rather than leaving them blank.
 */
export function dealHeroLinks(
  pool: readonly HeroLink[],
  rand: () => number = Math.random,
  slots: readonly HeroSlot[] = heroSlots
): HeroNodeLink[] {
  const byTier = new Map<HeroTier, HeroLink[]>();
  for (const link of pool) {
    const bucket = byTier.get(link.tier);
    if (bucket) bucket.push(link);
    else byTier.set(link.tier, [link]);
  }

  const picked: HeroLink[] = [];
  const leftovers: HeroLink[] = [];
  for (const [tier, links] of byTier) {
    const order = shuffled(links, rand);
    const quota = TIER_QUOTA[tier] ?? 0;
    picked.push(...order.slice(0, quota));
    leftovers.push(...order.slice(quota));
  }

  // Backfill from whatever is left so the layout never shows a gap.
  if (picked.length < slots.length) {
    picked.push(...shuffled(leftovers, rand).slice(0, slots.length - picked.length));
  }

  // Shuffle again so a tier doesn't always land in the same corner.
  return shuffled(picked, rand)
    .slice(0, slots.length)
    .map((link, i) => ({ ...link, ...slots[i], hue: TIER_HUE[link.tier] }));
}
