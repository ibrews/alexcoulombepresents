// ── Hero link-node layer tests ──────────────────────────────────────────────
// lib/linkNodes.ts is deliberately framework-free: no React, no canvas calls
// in update(), no DOM. That makes the whole interaction — lock spring,
// shockwave, clearance bubble, reduced-motion behavior — testable as plain
// arithmetic at a fixed timestep, which is far more trustworthy than eyeballing
// a 60fps canvas.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { LinkNodeLayer, NODE_REACH, type FieldParticle } from "../lib/linkNodes.ts";

const W = 1440;
const H = 800;
const FAR = { x: -9999, y: -9999 }; // pointer parked off-field

// No nav, no cutout: bands get the whole hero, so expected homes are simple
// arithmetic and every assertion below is about physics, not layout.
const OPEN = { navBottom: 0, cutoutTop: H, cutoutLeft: W, enabled: true };

const LINKS = [
  { href: "/a", label: "A", kicker: "", band: "left" as const, along: 0.5, inset: 360, hue: 174, tier: "primary" as const },
  { href: "/b", label: "B", kicker: "", band: "top" as const, along: 0.5, inset: 400, hue: 42, tier: "deep" as const },
];

function makeLayer(reduced = false) {
  const layer = new LinkNodeLayer(LINKS, { reduced });
  layer.resize(W, H, OPEN);
  return layer;
}

/** Advance `seconds` of physics at 60fps, integrating particles like the host does. */
function run(layer: LinkNodeLayer, seconds: number, particles: FieldParticle[] = []) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    layer.update(dt, particles, FAR);
    for (const p of particles) {
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
    }
  }
}

test("nodes start at their band-derived homes", () => {
  const layer = makeLayer();
  assert.equal(layer.nodes.length, 2);
  // "left" is inset from x=0 and spread down the hero.
  assert.equal(layer.nodes[0].x, 360);
  assert.equal(layer.nodes[0].y, 40 + 0.5 * (H - 80));
  // "top" hangs off the nav (0 here) and spreads across the width.
  assert.equal(layer.nodes[1].x, 40 + 0.5 * (W - 80));
  assert.equal(layer.nodes[1].y, 400);
});

test("disabled bounds stand the whole layer down", () => {
  const layer = new LinkNodeLayer(LINKS, {});
  layer.resize(390, 800, { ...OPEN, enabled: false });
  assert.deepEqual(layer.nodes, []);
  assert.deepEqual(layer.visibleLinks, []);
  // update/draw must be safe no-ops with nothing to draw.
  const p: FieldParticle = { x: 10, y: 10, vx: 0, vy: 0 };
  layer.setActive(0);
  run(layer, 0.5, [p]);
  assert.equal(p.vx, 0);
});

test("a home is never placed under the fixed header", () => {
  // A top-band node asking for an inset that would tuck it beneath the nav.
  const tucked = [{ href: "/t", label: "T", kicker: "", band: "top" as const, along: 0.5, inset: -50, hue: 174, tier: "deep" as const }];
  const layer = new LinkNodeLayer(tucked, {});
  layer.resize(W, H, { navBottom: 104, cutoutTop: H, cutoutLeft: W, enabled: true });
  // The invariant that matters: the top edge of the hit-target still clears
  // the header at the top of the node's wander, or the link is unclickable.
  const HALF_TARGET = 22;
  const VERTICAL_WANDER = 18;
  assert.ok(
    layer.nodes[0].y - HALF_TARGET - VERTICAL_WANDER >= 104,
    `hit-target must clear the header, got y=${layer.nodes[0].y}`
  );
});

test("the nav clamp does not flatten a band onto one line", () => {
  // Insets smaller than the clamp floor used to collapse every top-band node
  // to an identical y, which looked like a bug and hid four links behind each
  // other's labels. Distinct insets must stay distinct.
  const band = [33, 41, 49, 62].map((inset, i) => ({
    href: "/n" + i, label: "N", kicker: "", band: "top" as const, along: i * 0.2, inset, hue: 174, tier: "deep" as const,
  }));
  const layer = new LinkNodeLayer(band, {});
  layer.resize(W, H, { navBottom: 104, cutoutTop: H, cutoutLeft: W, enabled: true });
  const ys = new Set(layer.nodes.map((n) => Math.round(n.y)));
  assert.ok(ys.size >= 3, `expected varied heights, got ${[...ys].join(",")}`);
});

test("a side band is pulled in to fit its gutter, and dropped when it cannot", () => {
  const sides = [
    { href: "/l", label: "L", kicker: "", band: "left" as const, along: 0.5, inset: 300, hue: 174, tier: "deep" as const },
    { href: "/r", label: "R", kicker: "", band: "right" as const, along: 0.5, inset: 300, hue: 174, tier: "deep" as const },
  ];

  // A 200px gutter cannot hold a node asking to sit 300px in; it gets pulled
  // back to the deepest spot whose reach still clears the copy.
  const tight = new LinkNodeLayer(sides, {});
  tight.resize(W, H, { ...OPEN, gutterLeft: 200, gutterRight: 200 });
  assert.equal(tight.nodes.length, 2);
  assert.equal(tight.nodes[0].x, 200 - NODE_REACH);
  assert.equal(tight.nodes[1].x, W - (200 - NODE_REACH));

  // A gutter that is only the page's own padding has no honest home at all.
  const none = new LinkNodeLayer(sides, {});
  none.resize(W, H, { ...OPEN, gutterLeft: 20, gutterRight: 20 });
  assert.deepEqual(none.nodes, []);

  // …and one side closing must not take the other with it.
  const half = new LinkNodeLayer(sides, {});
  half.resize(W, H, { ...OPEN, gutterLeft: 20, gutterRight: 400 });
  assert.deepEqual(half.visibleLinks.map((l) => l.band), ["right"]);
});

test("omitting the gutters leaves the hero's own bands exactly where they were", () => {
  const link = [{ href: "/l", label: "L", kicker: "", band: "left" as const, along: 0.5, inset: 300, hue: 174, tier: "deep" as const }];
  const layer = new LinkNodeLayer(link, {});
  layer.resize(W, H, OPEN); // OPEN carries no gutterLeft/gutterRight
  assert.equal(layer.nodes[0].x, 300);
});

test("a bounds change never strands a node — the layer can be placed outright", () => {
  // The hosts SNAP on a bounds change rather than letting the home spring ease
  // across it. Measured (probe-hero.mjs) with the old glide: 2.28s of a
  // hit-target under the nav after the announcement banner slid the header
  // 64->104, and 1.65s off-screen after a 1440->1024 resize, because HOME_K is
  // 2.2 and the layout moved instantly. This pins the property the fix relies
  // on: snapToHomes() leaves every node exactly at a home the CURRENT bounds
  // produced, so "the homes are legal" is the only thing left to be true.
  const HALF = 22; // half a 44px fine-pointer hit-target
  const hero = [
    { href: "/t", label: "T", kicker: "", band: "top" as const, along: 0.2, inset: 41, hue: 174, tier: "deep" as const },
    { href: "/r", label: "R", kicker: "", band: "right" as const, along: 0.3, inset: 101, hue: 174, tier: "deep" as const },
  ];
  const layer = new LinkNodeLayer(hero, {});

  // Mount-time measurement: banner not applied, wide window.
  layer.resize(1440, 828, { navBottom: 64, cutoutTop: 466, cutoutLeft: 1048, enabled: true });
  layer.snapToHomes();

  // Both events that move the furniture, each followed by the snap the hosts do.
  for (const [w, h, navBottom] of [[1440, 828, 104], [1024, 736, 104]] as const) {
    layer.resize(w, h, { navBottom, cutoutTop: h * 0.56, cutoutLeft: w * 0.72, enabled: true });
    layer.snapToHomes();
    for (const n of layer.nodes) {
      assert.ok(n.y - HALF >= navBottom, `${w}x${h}: node top ${n.y - HALF} is under the nav (${navBottom})`);
      assert.ok(n.x + HALF <= w, `${w}x${h}: node right ${n.x + HALF} is off-screen`);
      assert.ok(n.x - HALF >= 0, `${w}x${h}: node left ${n.x - HALF} is off-screen`);
      assert.equal(n.vx, 0, "a snapped node carries no velocity");
      assert.equal(n.vy, 0, "a snapped node carries no velocity");
    }
  }
});

test("bands reclaim the cutout's space when the portrait is hidden", () => {
  const link = [{ href: "/f", label: "F", kicker: "", band: "floor" as const, along: 1, inset: 60, hue: 42, tier: "deep" as const }];
  const withCutout = new LinkNodeLayer(link, {});
  withCutout.resize(W, H, { navBottom: 104, cutoutTop: 362, cutoutLeft: 1048, enabled: true });
  const without = new LinkNodeLayer(link, {});
  without.resize(W, H, { navBottom: 104, cutoutTop: H, cutoutLeft: W, enabled: true });
  assert.ok(
    without.nodes[0].x > withCutout.nodes[0].x,
    "floor band should stop short of the cutout, and extend when it is gone"
  );
});

test("activating locks the node at the position it held, and it settles there", () => {
  const layer = makeLayer();
  run(layer, 3); // let it wander away from home first
  const node = layer.nodes[0];
  const grabbedX = node.x;
  const grabbedY = node.y;

  layer.setActive(0);
  // The lock point is where the node was, not its home.
  assert.ok(Math.abs(node.lockX - grabbedX) < 1e-9);
  assert.ok(Math.abs(node.lockY - grabbedY) < 1e-9);

  run(layer, 0.6);
  const settle = Math.hypot(node.x - grabbedX, node.y - grabbedY);
  assert.ok(settle < 2, `locked node should settle within 2px, got ${settle.toFixed(2)}`);
  assert.ok(Math.hypot(node.vx, node.vy) < 12, "locked node should be nearly at rest");
  assert.ok(node.act > 0.98, `activation should be complete, got ${node.act.toFixed(3)}`);
});

test("the lock spring arrives quickly — it is a settle, not a snap or a crawl", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  layer.setActive(0); // captures the lock point here…
  node.x -= 40; // …then knock it off, so there is a real distance to travel

  run(layer, 1 / 60);
  const afterOneFrame = Math.hypot(node.x - node.lockX, node.y - node.lockY);
  assert.ok(afterOneFrame > 0.001, "should not teleport in a single frame");

  run(layer, 0.35 - 1 / 60);
  assert.ok(
    Math.hypot(node.x - node.lockX, node.y - node.lockY) < 3,
    "should be essentially arrived by ~350ms"
  );
});

test("ripples sway dots by a few px — a lap, not a shove", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  // Frozen probes: no ambient drift, so any movement is the layer's doing.
  const probes = [40, 80, 140, 220, 320].map((r) => ({
    p: { x: node.x + r, y: node.y, vx: 0, vy: 0 } as FieldParticle,
    base: node.x + r,
  }));
  const peak = probes.map(() => 0);

  layer.setActive(0);
  for (let i = 0; i < 240; i++) {
    layer.update(1 / 60, probes.map((q) => q.p), FAR);
    probes.forEach((q, j) => {
      peak[j] = Math.max(peak[j], Math.abs(q.p.x - q.base));
    });
  }

  assert.ok(Math.max(...peak) > 3, `dots should visibly sway, peak=${Math.max(...peak).toFixed(1)}`);
  // The regression that matters. The force-based first version measured a
  // 1500px shove here and left a permanent crater around every link.
  assert.ok(
    Math.max(...peak) < 25,
    `sway must stay gentle, peak=${Math.max(...peak).toFixed(1)}px`
  );
});

test("the layer never injects velocity into the ambient field", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const ps: FieldParticle[] = [30, 90, 200].map((r) => ({ x: node.x + r, y: node.y, vx: 0, vy: 0 }));

  layer.setActive(0);
  run(layer, 3, ps);
  // Displacement, not force: velocity is the ambient sim's business alone.
  for (const p of ps) {
    assert.equal(p.vx, 0, "no vx imparted");
    assert.equal(p.vy, 0, "no vy imparted");
  }
});

test("every dot returns exactly to where the ambient field had it", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const ps: FieldParticle[] = [35, 75, 150, 260].map((r) => ({ x: node.x + r, y: node.y, vx: 0, vy: 0 }));
  const base = ps.map((p) => p.x);

  layer.setActive(0);
  run(layer, 3, ps);
  assert.ok(Math.abs(ps[0].x - base[0]) > 1, "should be displaced while held");

  layer.setActive(null);
  run(layer, 3, ps);
  ps.forEach((p, i) => {
    assert.ok(
      Math.abs(p.x - base[i]) < 1e-9,
      `dot ${i} must land back exactly, off by ${(p.x - base[i]).toFixed(4)}`
    );
  });
});

test("ripples keep lapping while a node is held", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 260, y: node.y, vx: 0, vy: 0 };
  const base = p.x;

  layer.setActive(0);
  const series: number[] = [];
  for (let i = 0; i < 420; i++) {
    layer.update(1 / 60, [p], FAR);
    series.push(p.x - base);
  }

  // Count separate crests: a single activation bang would show exactly one.
  let crests = 0;
  for (let i = 1; i < series.length - 1; i++) {
    if (series[i] > 0.4 && series[i] >= series[i - 1] && series[i] > series[i + 1]) crests++;
  }
  assert.ok(crests >= 2, `expected repeated lapping, counted ${crests} crest(s)`);
});

test("a held node eases its neighbours outward, gently", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 30, y: node.y, vx: 0, vy: 0 };

  layer.setActive(0);
  run(layer, 1.5, [p]);
  const gap = p.x - node.x - 30;
  assert.ok(gap > 2, `should ease clear of the label, moved ${gap.toFixed(1)}px`);
  assert.ok(gap < 20, `but only just — moved ${gap.toFixed(1)}px`);
});

test("reduced motion pins nodes to home, snaps activation, and fires no wave", () => {
  const layer = makeLayer(true);
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 200, y: node.y, vx: 0, vy: 0 };

  layer.setActive(0);
  run(layer, 1 / 60, [p]);
  assert.equal(node.act, 1, "activation is instantaneous with reduced motion");
  assert.equal(node.x, 360, "node stays exactly at home");

  run(layer, 2, [p]);
  assert.equal(p.vx, 0, "no ripples at all under reduced motion");
  assert.equal(p.x, node.x + 200, "and no displacement either");

  layer.setActive(null);
  run(layer, 1 / 60, [p]);
  assert.equal(node.act, 0);
});

test("a long frame gap cannot explode the simulation", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 50, y: node.y, vx: 0, vy: 0 };
  layer.setActive(0);

  // Backgrounded tab: one 4-second "frame".
  layer.update(4, [p], FAR);
  assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
  assert.ok(Math.hypot(node.vx, node.vy) < 500, "velocity stays sane after a huge dt");
  assert.ok(Math.abs(p.x - node.x - 50) < 40, "particle displacement stays sane after a huge dt");
});

test("snapToHomes places nodes outright, for the post-mount correction", () => {
  const layer = makeLayer();
  run(layer, 2); // drift away from home
  const node = layer.nodes[0];
  assert.ok(Math.hypot(node.x - node.hx, node.y - node.hy) > 0.5, "should have drifted first");

  layer.snapToHomes();
  assert.equal(node.x, node.hx);
  assert.equal(node.y, node.hy);
  assert.equal(node.vx, 0);
  assert.equal(node.vy, 0);
  // A lock captured at the old position would yank it straight back.
  assert.equal(node.lockX, node.hx);
});

test("resize preserves live positions instead of teleporting the constellation", () => {
  const layer = makeLayer();
  run(layer, 2);
  const before = { x: layer.nodes[0].x, y: layer.nodes[0].y };
  layer.resize(W, H, OPEN);
  assert.equal(layer.nodes[0].x, before.x);
  assert.equal(layer.nodes[0].y, before.y);
});

test("clearing an out-of-range active index on resize does not crash", () => {
  const layer = makeLayer();
  layer.setActive(1);
  layer.resize(390, 800, { ...OPEN, enabled: false }); // both disappear
  assert.equal(layer.active, null);
  run(layer, 0.5);
});
