// ── Hero constellation link draw ────────────────────────────────────────────
// The pool builder is server-side and touches the filesystem, so it is not
// exercised here (npm run audit:hero-links covers it against a real build).
// What IS worth pinning down is the draw: it decides what a visitor sees, it
// is random, and "random" is exactly the kind of thing that quietly stops
// being random.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dealHeroLinks,
  heroSlots,
  TIER_QUOTA,
  TIER_HUE,
  isExternal,
  type HeroLink,
  type HeroTier,
} from "../lib/heroLinks.ts";

const TIERS: HeroTier[] = ["primary", "section", "deep", "external"];

/** A pool big enough that every tier can overfill its quota several times. */
function makePool(perTier = 30): HeroLink[] {
  return TIERS.flatMap((tier) =>
    Array.from({ length: perTier }, (_, i) => ({
      href: tier === "external" ? `https://example.com/${tier}-${i}` : `/${tier}-${i}`,
      label: `${tier} ${i}`,
      kicker: tier,
      tier,
    }))
  );
}

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

test("quotas sum to the number of slots", () => {
  const total = TIERS.reduce((n, t) => n + TIER_QUOTA[t], 0);
  assert.equal(total, heroSlots.length, "every slot must be spoken for");
});

test("a draw fills every slot, with the promised number from each tier", () => {
  const pool = makePool();
  for (let seed = 1; seed <= 25; seed++) {
    const hand = dealHeroLinks(pool, seeded(seed));
    assert.equal(hand.length, heroSlots.length);
    for (const tier of TIERS) {
      assert.equal(
        hand.filter((l) => l.tier === tier).length,
        TIER_QUOTA[tier],
        `tier ${tier} count is fixed across visits (seed ${seed})`
      );
    }
  }
});

test("a draw never repeats a destination", () => {
  const pool = makePool();
  for (let seed = 1; seed <= 25; seed++) {
    const hand = dealHeroLinks(pool, seeded(seed));
    assert.equal(new Set(hand.map((l) => l.href)).size, hand.length, `seed ${seed}`);
  }
});

test("every slot is used exactly once, so the layout never doubles up", () => {
  const hand = dealHeroLinks(makePool(), seeded(7));
  const used = hand.map((l) => `${l.band}|${l.along}|${l.inset}`);
  assert.equal(new Set(used).size, heroSlots.length);
});

test("successive visits actually differ", () => {
  const pool = makePool();
  const first = dealHeroLinks(pool, seeded(1)).map((l) => l.href).join();
  let different = 0;
  for (let seed = 2; seed <= 20; seed++) {
    if (dealHeroLinks(pool, seeded(seed)).map((l) => l.href).join() !== first) different++;
  }
  // The whole point of the feature. A constant draw would score 0.
  assert.ok(different >= 18, `expected variety across visits, got ${different}/19`);
});

test("a tier is not pinned to one corner of the hero", () => {
  const pool = makePool();
  const bands = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) {
    for (const l of dealHeroLinks(pool, seeded(seed))) {
      if (l.tier === "primary") bands.add(l.band);
    }
  }
  assert.ok(bands.size >= 3, `primary links should move around, saw ${[...bands].join()}`);
});

test("hue is assigned by tier, so the mix stays readable", () => {
  for (const l of dealHeroLinks(makePool(), seeded(3))) {
    assert.equal(l.hue, TIER_HUE[l.tier]);
  }
});

test("a thin tier gives its slots back instead of leaving gaps", () => {
  // Only one primary link exists; the other two primary slots must be filled.
  const thin: HeroLink[] = [
    { href: "/about", label: "About", kicker: "", tier: "primary" },
    ...makePool(20).filter((l) => l.tier !== "primary"),
  ];
  const hand = dealHeroLinks(thin, seeded(11));
  assert.equal(hand.length, heroSlots.length, "no blank slots");
  assert.equal(new Set(hand.map((l) => l.href)).size, hand.length, "and still no repeats");
});

test("a pool smaller than the slot count degrades without crashing", () => {
  const tiny: HeroLink[] = [
    { href: "/a", label: "A", kicker: "", tier: "primary" },
    { href: "/b", label: "B", kicker: "", tier: "deep" },
  ];
  const hand = dealHeroLinks(tiny, seeded(5));
  assert.equal(hand.length, 2);
  assert.equal(new Set(hand.map((l) => l.href)).size, 2);
});

test("external links are recognised, internal ones are not", () => {
  assert.ok(isExternal({ href: "https://youtu.be/abc" }));
  assert.ok(isExternal({ href: "http://example.com" }));
  assert.ok(!isExternal({ href: "/repos/ue5-mcp" }));
  assert.ok(!isExternal({ href: "/appearances#gdc-2024" }));
  // A protocol-relative or mailto href must not be client-routed as a path.
  assert.ok(!isExternal({ href: "mailto:info@alexcoulombepresents.com" }));
});
