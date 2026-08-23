// How long do hero link nodes spend in a bad place after the two events that
// move their homes? Pure physics, no browser — the layer is framework-free.
import { LinkNodeLayer } from "./lib/linkNodes.ts";
import { heroSlots, dealHeroLinks } from "./lib/heroLinks.ts";

const TIERS = ["primary", "section", "deep", "external"];
const pool = TIERS.flatMap((t) =>
  Array.from({ length: 20 }, (_, i) => ({
    href: t === "external" ? `https://e.com/${t}-${i}` : `/${t}-${i}`,
    label: t, kicker: t, tier: t,
  }))
);
function seeded(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FAR = { x: -9999, y: -9999 };
const HALF = 22; // half a 44px fine-pointer hit-target

// Advance until `ok(layer)` holds, or give up. Returns seconds elapsed.
function timeUntil(layer, ok, limit = 20) {
  for (let i = 0; i < limit * 60; i++) {
    if (ok(layer)) return i / 60;
    layer.update(1 / 60, [], FAR);
  }
  return Infinity;
}

const H = 828; // hero at 1440x900 (min-h-[92vh])

console.log("(snap=true is what FaceField now does on every bounds change)\n=== A. Announcement banner slides the nav 64 -> 104 after mount ===");
for (const snap of [false, true]) {
  let worst = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const layer = new LinkNodeLayer(dealHeroLinks(pool, seeded(seed), heroSlots), {});
    // Mount-time measurement: banner not applied yet.
    layer.resize(1440, H, { navBottom: 64, cutoutTop: 466, cutoutLeft: 1048, enabled: true });
    layer.snapToHomes();
    // Banner lands; the 400ms poll re-measures homes.
    layer.resize(1440, H, { navBottom: 104, cutoutTop: 466, cutoutLeft: 1048, enabled: true });
    if (snap) layer.snapToHomes();
    const t = timeUntil(layer, (l) => l.nodes.every((n) => n.y - HALF >= 104));
    worst = Math.max(worst, t);
  }
  console.log(`  ${snap ? "WITH snap " : "no snap   "}: worst time with a hit-target under the nav = ${worst.toFixed(2)}s`);
}

console.log("\n=== B. Window resize 1440 -> 1024 (bands are viewport-anchored) ===");
for (const snap of [false, true]) {
  let worst = 0, worstX = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const layer = new LinkNodeLayer(dealHeroLinks(pool, seeded(seed), heroSlots), {});
    layer.resize(1440, H, { navBottom: 104, cutoutTop: 466, cutoutLeft: 1048, enabled: true });
    layer.snapToHomes();
    const H2 = 736; // hero at 1024x800
    layer.resize(1024, H2, { navBottom: 104, cutoutTop: 414, cutoutLeft: 655, enabled: true });
    if (snap) layer.snapToHomes();
    worstX = Math.max(worstX, ...layer.nodes.map((n) => n.x + HALF));
    const t = timeUntil(layer, (l) => l.nodes.every((n) => n.x + HALF <= 1024 && n.x - HALF >= 0));
    worst = Math.max(worst, t);
  }
  console.log(`  ${snap ? "WITH snap " : "no snap   "}: worst time with a hit-target off-screen = ${worst.toFixed(2)}s   (furthest right edge immediately after: ${worstX.toFixed(0)}px vs viewport 1024)`);
}
