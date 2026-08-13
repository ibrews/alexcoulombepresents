// ── /lab constellation layout ───────────────────────────────────────────────
// The homepage's version of this shipped a real bug that only measurement
// caught: at 1024x800 a 44px hit-target's top edge landed at y103 under a nav
// ending at y104. So this file does not eyeball anything. It replays the two
// layouts measured off the running page (docs/perf/hero-field.md) through the
// real LinkNodeLayer and asserts, in viewport pixels, that no node's tap area
// can reach the nav, the headline, or off-screen — at the WORST point of its
// drift, not at its resting home.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { dealHeroLinks, TIER_HUE, type HeroLink, type HeroNodeLink, type HeroTier } from "../lib/heroLinks.ts";
import { labSlots, LAB_TIER_QUOTA, LAB_LINK_MIN_W, LAB_LINK_MIN_H } from "../lib/labLinks.ts";
import { LinkNodeLayer, NODE_REACH } from "../lib/linkNodes.ts";

const TIERS: HeroTier[] = ["primary", "section", "deep", "external"];

/**
 * app/lab/page.tsx, measured in a real browser on 2026-08-13. `gutterLeft` /
 * `gutterRight` are what ParticleField.measureBounds() derives: the free px
 * between each canvas edge and the page's opening copy.
 *
 * The 1024 row is the whole point of this fixture — there, the left margin is
 * the section's own 20px padding, i.e. no margin at all.
 */
const LAYOUTS = [
  {
    name: "1440x900",
    vw: 1440,
    canvas: { left: 0, top: 128, w: 1440, h: 393 },
    navBottom: 64,
    h1: { left: 164, top: 182, right: 932, bottom: 302 },
    gutterLeft: 164,
    gutterRight: 508,
    expectBands: new Set(["left", "right"]),
  },
  {
    name: "1024x800",
    vw: 1024,
    canvas: { left: 0, top: 128, w: 1024, h: 393 },
    navBottom: 64,
    h1: { left: 20, top: 182, right: 788, bottom: 302 },
    gutterLeft: 20,
    gutterRight: 236,
    expectBands: new Set(["right"]),
  },
];

/** Deterministic, well-spread stand-in for Math.random (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePool(perTier = 20): HeroLink[] {
  return TIERS.flatMap((tier) =>
    Array.from({ length: perTier }, (_, i) => ({
      href: tier === "external" ? `https://example.com/${tier}-${i}` : `/${tier}-${i}`,
      label: `${tier} ${i}`,
      kicker: tier,
      tier,
    }))
  );
}

/** The dealt hand, in slot order, so band/inset assertions are decidable. */
function hand(seed = 3): HeroNodeLink[] {
  return dealHeroLinks(makePool(), seeded(seed), labSlots, LAB_TIER_QUOTA);
}

function layerFor(layout: (typeof LAYOUTS)[number], seed = 3) {
  const layer = new LinkNodeLayer(hand(seed), {});
  layer.resize(layout.canvas.w, layout.canvas.h, {
    // The nav sits ABOVE this canvas (it ends at y64, the band starts at
    // y128), so the canvas-local navBottom clamps to 0 — exactly what
    // ParticleField passes.
    navBottom: 0,
    cutoutTop: layout.canvas.h,
    cutoutLeft: layout.canvas.w,
    gutterLeft: layout.gutterLeft,
    gutterRight: layout.gutterRight,
    enabled: true,
  });
  return layer;
}

/**
 * Worst-case tap area of a node, in VIEWPORT px. NODE_REACH already carries
 * the idle wander plus half of the largest hit-target (56px, coarse pointer);
 * "drift stays inside NODE_REACH" is not assumed here, it is measured by the
 * simulation test at the bottom of this file.
 */
function hitBox(layout: (typeof LAYOUTS)[number], n: { x: number; y: number }) {
  return {
    left: layout.canvas.left + n.x - NODE_REACH,
    right: layout.canvas.left + n.x + NODE_REACH,
    top: layout.canvas.top + n.y - NODE_REACH,
    bottom: layout.canvas.top + n.y + NODE_REACH,
  };
}

const overlaps = (a: ReturnType<typeof hitBox>, b: { left: number; right: number; top: number; bottom: number }) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// ── Deck ────────────────────────────────────────────────────────────────────

test("the lab quota accounts for every lab slot", () => {
  const total = TIERS.reduce((n, t) => n + LAB_TIER_QUOTA[t], 0);
  assert.equal(total, labSlots.length);
});

test("a lab draw fills every slot with the promised mix, and never repeats", () => {
  for (let seed = 1; seed <= 25; seed++) {
    const h = hand(seed);
    assert.equal(h.length, labSlots.length, `seed ${seed}`);
    assert.equal(new Set(h.map((l) => l.href)).size, h.length, `seed ${seed} repeats a destination`);
    for (const tier of TIERS) {
      assert.equal(h.filter((l) => l.tier === tier).length, LAB_TIER_QUOTA[tier], `${tier}, seed ${seed}`);
    }
    for (const l of h) assert.equal(l.hue, TIER_HUE[l.tier]);
  }
});

test("lab slots live only in the margins, never in a band that crosses the copy", () => {
  // `top` spans the full width and `floor` is anchored to the band's bottom
  // edge — heroSlots' floor insets of 46–83 land at y 310–347 here, which is
  // the headline. Neither band has an honest home on this page.
  for (const s of labSlots) {
    assert.ok(s.band === "left" || s.band === "right", `unexpected band ${s.band}`);
    assert.ok(s.along >= 0.1 && s.along <= 0.9, `along ${s.along} risks clipping in the 393px band`);
  }
});

// ── Geometry, per measured layout ───────────────────────────────────────────

for (const layout of LAYOUTS) {
  test(`${layout.name}: no hit-target reaches the nav, the h1, or off-screen`, () => {
    // Every seed, because which link lands in which slot is a fresh shuffle
    // on every visit and the layout must hold for all of them.
    for (let seed = 1; seed <= 25; seed++) {
      const layer = layerFor(layout, seed);
      assert.ok(layer.nodes.length > 0, `${layout.name} should render some nodes`);
      for (const n of layer.nodes) {
        const box = hitBox(layout, n);
        assert.ok(box.top > layout.navBottom, `seed ${seed}: node top ${box.top} is under the nav (${layout.navBottom})`);
        assert.ok(box.left >= 0, `seed ${seed}: node left ${box.left} runs off-screen`);
        assert.ok(box.right <= layout.vw, `seed ${seed}: node right ${box.right} runs off-screen`);
        assert.ok(!overlaps(box, layout.h1), `seed ${seed}: node ${JSON.stringify(box)} overlaps the h1`);
        // And inside its own canvas, which is `overflow-hidden` — a clipped
        // half-dot reads as a rendering bug.
        assert.ok(box.top >= layout.canvas.top, `seed ${seed}: clipped at the band's top edge`);
        assert.ok(
          box.bottom <= layout.canvas.top + layout.canvas.h,
          `seed ${seed}: clipped at the band's bottom edge`
        );
      }
    }
  });

  test(`${layout.name}: only the bands whose gutter can hold a node survive`, () => {
    const layer = layerFor(layout);
    const bands = new Set(layer.visibleLinks.map((l) => l.band));
    assert.deepEqual(bands, layout.expectBands);
    // …and the count matches what those bands are worth, so a dropped band
    // drops its nodes rather than stacking them on the copy's edge.
    const expected = labSlots.filter((s) => layout.expectBands.has(s.band)).length;
    assert.equal(layer.nodes.length, expected);
  });
}

test("1024 keeps a real constellation rather than degrading to one lonely dot", () => {
  const layer = layerFor(LAYOUTS[1]);
  assert.ok(layer.nodes.length >= 4, `got ${layer.nodes.length} nodes at 1024`);
});

test("the field stands down entirely below the minimum it was measured at", () => {
  const layer = new LinkNodeLayer(hand(), {});
  layer.resize(390, 260, {
    navBottom: 0,
    cutoutTop: 260,
    cutoutLeft: 390,
    gutterLeft: 20,
    gutterRight: 20,
    enabled: 390 >= LAB_LINK_MIN_W && 260 >= LAB_LINK_MIN_H,
  });
  assert.deepEqual(layer.nodes, []);
});

// ── The assumption behind NODE_REACH, measured rather than trusted ──────────

test("a node's drift never exceeds NODE_REACH, so the boxes above are honest", () => {
  for (const layout of LAYOUTS) {
    const layer = layerFor(layout);
    const homes = layer.nodes.map((n) => ({ hx: n.hx, hy: n.hy }));
    let worst = 0;
    // 60 seconds of physics, with the pointer sweeping through the field so
    // the dodge impulse is exercised too — that is the force that can push a
    // node further than its own wander amplitude.
    for (let i = 0; i < 3600; i++) {
      const t = i / 60;
      layer.update(1 / 60, [], {
        x: (t * 90) % (layout.canvas.w + 200),
        y: (Math.sin(t * 0.7) * 0.5 + 0.5) * layout.canvas.h,
      });
      layer.nodes.forEach((n, j) => {
        worst = Math.max(worst, Math.abs(n.x - homes[j].hx), Math.abs(n.y - homes[j].hy));
      });
    }
    // NODE_REACH is wander + half a 56px tap target, so the drift budget is
    // the wander half of it. If this ever fails the hit-boxes above are
    // understated and the layout claims are void.
    assert.ok(
      worst <= NODE_REACH - 28,
      `${layout.name}: drift reached ${worst.toFixed(1)}px, budget ${NODE_REACH - 28}px`
    );
  }
});
