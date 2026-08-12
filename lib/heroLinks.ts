// The knowledge-graph link set for the hero constellation.
//
// Every dot in the hero that is *bigger and haloed* is one of these — a real
// destination on the site. The set is deliberately the top nav (7 entries,
// see components/Nav.tsx) plus the six pages that lost their nav slot in
// commit 5c19fd2 but are still first-class: Skills, Videos, Plugins, Links,
// Newsletter, Support. The ⌘K palette (components/CommandPalette.tsx) remains
// the exhaustive index; this is the hand-picked constellation.
//
// ── Why bands and not x/y fractions ──────────────────────────────────────
// The obvious encoding — a fractional (fx, fy) per node — was tried first and
// is wrong. The hero is `min-h-[92vh]`, so its height tracks the window while
// the things a node must avoid do NOT: the fixed header is always 104px tall
// and the portrait cutout is pinned to the bottom-right corner. A node at
// fy 0.17 sits comfortably below the nav on a 900px-tall window (y 141) and
// disappears *underneath* it on a 800px one (y 125, with a 44px hit-target
// whose top edge lands at 103). Measured at 1024x800 all four top-band nodes
// collapsed onto a single line once clamped away from the header.
//
// So each node is anchored to an EDGE it actually cares about, in pixels,
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
//
// Nodes wander ~26px around home and spring back (WANDER_AMP in
// lib/linkNodes.ts), so the constellation stays recognizable between visits.
// Insets leave room for that wander plus the hit-target's half-height.

export type HeroBand = "top" | "right" | "left" | "floor";

export type HeroLink = {
  href: string;
  label: string;
  /** Shown under the label in the tooltip — the destination, in plain words. */
  kicker: string;
  band: HeroBand;
  /** 0–1 along the band's free axis (across for top/floor, down for left/right). */
  along: number;
  /** Distance in px from the edge this band is anchored to. */
  inset: number;
  /** Matches the existing particle palette: 174 teal, 262 grape, 42 amber. */
  hue: number;
};

export const heroLinks: HeroLink[] = [
  // ── Strip under the nav ───────────────────────────────────
  { href: "/about", label: "About", kicker: "Architect turned XR-chitect", band: "top", along: 0.11, inset: 49, hue: 42 },
  { href: "/training", label: "Training", kicker: "Live Unreal & AI classes", band: "top", along: 0.3, inset: 41, hue: 174 },
  { href: "/repos", label: "Open Source", kicker: "Public repos & tools", band: "top", along: 0.47, inset: 62, hue: 174 },
  { href: "/lab", label: "The Lab", kicker: "What's still cooking", band: "top", along: 0.64, inset: 44, hue: 262 },

  // ── Right shoulder, above the portrait cutout ─────────────
  { href: "/videos", label: "Videos", kicker: "YouTube & recorded sessions", band: "right", along: 0.08, inset: 101, hue: 262 },
  { href: "/appearances", label: "Appearances", kicker: "Talks, panels, festivals", band: "right", along: 0.32, inset: 290, hue: 262 },
  { href: "/store", label: "Store", kicker: "Courses, assets, downloads", band: "right", along: 0.64, inset: 201, hue: 42 },

  // ── Left margin ───────────────────────────────────────────
  { href: "/plugins", label: "Plugins", kicker: "Licensed Unreal plugins", band: "left", along: 0.28, inset: 65, hue: 174 },
  { href: "/links", label: "Links", kicker: "Everywhere else I am", band: "left", along: 0.62, inset: 58, hue: 174 },

  // ── Floor, below the CTAs ─────────────────────────────────
  { href: "/contact", label: "Contact", kicker: "Say hello", band: "floor", along: 0.07, inset: 83, hue: 42 },
  { href: "/newsletter", label: "Newsletter", kicker: "Monthly dispatch", band: "floor", along: 0.34, inset: 46, hue: 42 },
  { href: "/support", label: "Support the Lab", kicker: "Keep the experiments running", band: "floor", along: 0.55, inset: 83, hue: 42 },
  { href: "/skills", label: "AI Skills", kicker: "Agent skills you can install", band: "floor", along: 0.78, inset: 138, hue: 174 },
];
