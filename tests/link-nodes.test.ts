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
import { LinkNodeLayer, type FieldParticle } from "../lib/linkNodes.ts";

const W = 1440;
const H = 800;
const FAR = { x: -9999, y: -9999 }; // pointer parked off-field

// No nav, no cutout: bands get the whole hero, so expected homes are simple
// arithmetic and every assertion below is about physics, not layout.
const OPEN = { navBottom: 0, cutoutTop: H, cutoutLeft: W, enabled: true };

const LINKS = [
  { href: "/a", label: "A", kicker: "", band: "left" as const, along: 0.5, inset: 360, hue: 174 },
  { href: "/b", label: "B", kicker: "", band: "top" as const, along: 0.5, inset: 400, hue: 42 },
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
  const tucked = [{ href: "/t", label: "T", kicker: "", band: "top" as const, along: 0.5, inset: -50, hue: 174 }];
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
    href: "/n" + i, label: "N", kicker: "", band: "top" as const, along: i * 0.2, inset, hue: 174,
  }));
  const layer = new LinkNodeLayer(band, {});
  layer.resize(W, H, { navBottom: 104, cutoutTop: H, cutoutLeft: W, enabled: true });
  const ys = new Set(layer.nodes.map((n) => Math.round(n.y)));
  assert.ok(ys.size >= 3, `expected varied heights, got ${[...ys].join(",")}`);
});

test("bands reclaim the cutout's space when the portrait is hidden", () => {
  const link = [{ href: "/f", label: "F", kicker: "", band: "floor" as const, along: 1, inset: 60, hue: 42 }];
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

test("activation fires one travelling wave that pushes particles outward", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  // Well outside the clearance bubble, so only the wave can reach it.
  const p: FieldParticle = { x: node.x + 400, y: node.y, vx: 0, vy: 0 };

  layer.setActive(0);
  run(layer, 0.35, [p]); // ring is at ~240px — hasn't arrived yet
  assert.ok(p.vx < 0.01, `particle should be untouched before the ring arrives, vx=${p.vx}`);

  run(layer, 0.35, [p]); // ring sweeps past ~400px
  assert.ok(p.vx > 0.5, `particle should be shoved outward by the ring, vx=${p.vx.toFixed(3)}`);
  assert.ok(p.x > node.x + 400, "and should have moved away from the node");
});

test("the wave is transient — it decays and stops acting", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 400, y: node.y, vx: 0, vy: 0 };

  layer.setActive(0);
  run(layer, 3, [p]);
  const restX = p.x;
  p.vx = 0;
  p.vy = 0;
  run(layer, 2, [p]);
  assert.ok(Math.abs(p.x - restX) < 0.5, "no residual impulse once the wave has died");
});

test("re-activating the same node does not re-fire; a different node does", () => {
  const layer = makeLayer();
  const probe = () => ({ x: layer.nodes[0].x + 300, y: layer.nodes[0].y, vx: 0, vy: 0 });

  layer.setActive(0);
  layer.setActive(0); // idempotent
  const p1 = probe();
  run(layer, 0.6, [p1]);
  const single = p1.vx;

  const layer2 = makeLayer();
  layer2.setActive(0);
  layer2.setActive(null);
  layer2.setActive(0); // genuine re-entry: two waves
  const p2 = { x: layer2.nodes[0].x + 300, y: layer2.nodes[0].y, vx: 0, vy: 0 };
  run(layer2, 0.6, [p2]);
  assert.ok(p2.vx > single * 1.5, "a fresh activation should stack another wave");
});

test("the clearance bubble holds dots out while locked, and releases them after", () => {
  const layer = makeLayer();
  const node = layer.nodes[0];
  const p: FieldParticle = { x: node.x + 30, y: node.y, vx: 0, vy: 0 };

  layer.setActive(0);
  run(layer, 1.2, [p]);
  const held = p.x - node.x;
  assert.ok(held > 100, `dot should be pushed clear of the label, gap=${held.toFixed(1)}px`);

  layer.setActive(null);
  run(layer, 1.5, [p]);
  assert.ok(layer.nodes[0].act < 0.01, "activation should have fully eased out");

  // Measure the particle in absolute terms — the node itself keeps wandering,
  // so a node-relative gap would move even with zero force on the particle.
  const restX = p.x;
  p.vx = 0;
  p.vy = 0;
  run(layer, 1, [p]);
  assert.ok(Math.abs(p.x - restX) < 0.5, "no lingering push once released");
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
  assert.equal(p.vx, 0, "no wave and no clearance force under reduced motion");
  assert.equal(p.x, node.x + 200);

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
  assert.ok(Math.abs(p.vx) < 50, "particle impulse stays sane after a huge dt");
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
