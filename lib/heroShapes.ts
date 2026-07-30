// ── Hero point-cloud shape generators ───────────────────────────────────────
//
// Ported from Alex's own agilelens.com/easteregg piece (the "Unbuilt Theater"
// point-cloud installation). That piece proved the pattern this file reuses:
// every generator returns EXACTLY `HERO_POINT_COUNT` points (padding by
// jittering existing points via `fill()` when a shape naturally produces
// fewer), so morphing between any two forms is a straight per-index lerp —
// no resampling, no nearest-neighbor matching, just walk both Float32Arrays
// in lockstep. Positions AND colors both lerp.
//
// Recolored to this site's brand palette (teal/grape/amber/snow) instead of
// the theater piece's plaster/gilt/velvet palette, and simplified: the
// easteregg's globe generator baked in Agile Lens' actual client-site list
// (NYC/Orlando/DC/...) via great-circle arcs — that's business-specific
// content that doesn't belong on Alex's personal site, so this version keeps
// the recognizable "wireframe globe with beacons" read but with generic
// beacon placements instead.

// Every form is resampled/padded to this many points so morphing is a
// straight per-index lerp against the parsed splat (see lib/parseSplat.ts).
// 30k is comfortably inside a single point/instance draw call and reads as
// a dense capture at hero-backdrop scale without taxing a decorative,
// desktop-only, idle-activated background element.
export const HERO_POINT_COUNT = 30000;

export type FormData = { pos: Float32Array; col: Float32Array };

// ---- color helpers (plain [r,g,b] 0..1 tuples — no THREE dependency here,
// so this module stays a pure data generator, testable/renderable headless) ----
type RGB = [number, number, number];

function hexToRgb(hex: number): RGB {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

function jitter([r, g, b]: RGB, amt: number): RGB {
  const k = 1 + rand(-amt, amt);
  return [Math.min(1, r * k), Math.min(1, g * k), Math.min(1, b * k)];
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Brand palette — app/globals.css @theme.
const TEAL: RGB = hexToRgb(0x2dd4bf);
const GRAPE: RGB = hexToRgb(0xa78bfa);
const AMBER: RGB = hexToRgb(0xfbbf24);
const SNOW: RGB = hexToRgb(0xececf6);
const MIST: RGB = hexToRgb(0x9b9bb5);

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function push(pos: number[], col: number[], x: number, y: number, z: number, c: RGB) {
  pos.push(x, y, z);
  col.push(c[0], c[1], c[2]);
}

// Pad/trim to exactly HERO_POINT_COUNT points — mirrors the easteregg's fill().
function fill(pos: number[], col: number[]): FormData {
  while (pos.length / 3 < HERO_POINT_COUNT) {
    const j = Math.floor(Math.random() * (pos.length / 3));
    pos.push(pos[j * 3] + rand(-0.05, 0.05), pos[j * 3 + 1] + rand(-0.05, 0.05), pos[j * 3 + 2] + rand(-0.05, 0.05));
    col.push(col[j * 3], col[j * 3 + 1], col[j * 3 + 2]);
  }
  return {
    pos: new Float32Array(pos.slice(0, HERO_POINT_COUNT * 3)),
    col: new Float32Array(col.slice(0, HERO_POINT_COUNT * 3)),
  };
}

/*
 * genWave — a cresting wave, teal trough to snow foam. R sets the overall
 * scale so it sits in the same bounding sphere as the parsed splat capture.
 */
export function genWave(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 9; // easteregg tuned this at roughly R≈9 (its "-26..26" span)

  function waterColor(y: number, foam: boolean): RGB {
    if (foam) return jitter(SNOW, 0.08);
    const t = Math.min(1, Math.max(0, y / (7 * s)));
    return jitter(lerpRgb(TEAL, hexToRgb(0x8fe8dc), t), 0.15);
  }

  // Open water fore and aft
  for (let i = 0; i < HERO_POINT_COUNT * 0.26; i++) {
    const x = rand(-26, 26) * s;
    const z = (Math.random() < 0.62 ? rand(8.5, 20) : rand(-20, -7)) * s;
    const y = (0.4 + 0.5 * Math.sin((x / s) * 0.25) * Math.cos((z / s) * 0.2) + rand(-0.15, 0.15)) * s;
    push(pos, col, x, y, z, waterColor(y + 1.5 * s, false));
  }
  // The rising face
  for (let i = 0; i < HERO_POINT_COUNT * 0.3; i++) {
    const x = rand(-26, 26) * s;
    const zc = (-1 + Math.sin((x / s) * 0.22) * 1.2) * s;
    const h = (6.2 + Math.sin((x / s) * 0.13 + 1.7) * 0.9) * s;
    const u = Math.random();
    const z = 8.5 * s - u * (8.5 * s - zc);
    const y = Math.pow(u, 1.35) * h + rand(-0.12, 0.12) * s;
    push(pos, col, x, y, z, waterColor(y, false));
  }
  // The curl
  for (let i = 0; i < HERO_POINT_COUNT * 0.26; i++) {
    const x = rand(-26, 26) * s;
    const zc = (-1 + Math.sin((x / s) * 0.22) * 1.2) * s;
    const h = (6.2 + Math.sin((x / s) * 0.13 + 1.7) * 0.9) * s;
    const u = Math.random();
    const phi = Math.PI * 0.5 - u * Math.PI * 1.45;
    const rr = (3.1 - u * 2.1) * (h / (6.2 * s)) * s;
    const y = (h - rr * 0.4) * 0.82 + rr * Math.sin(phi);
    const z = zc - rr * Math.cos(phi);
    const foam = u > 0.8 || Math.random() < 0.04;
    push(pos, col, x, Math.max(0.1 * s, y), z, waterColor(y, foam));
  }
  // Spray off the lip
  for (let i = 0; i < HERO_POINT_COUNT * 0.06; i++) {
    const x = rand(-26, 26) * s;
    const h = (6.2 + Math.sin((x / s) * 0.13 + 1.7) * 0.9) * s;
    push(
      pos,
      col,
      x + rand(-0.5, 0.5) * s,
      h + rand(-0.4, 2.6) * s,
      (-1 + Math.sin((x / s) * 0.22) * 1.2) * s + rand(-3.2, 0.6) * s,
      waterColor(9 * s, Math.random() < 0.7)
    );
  }
  while (pos.length / 3 < HERO_POINT_COUNT * 0.98) {
    push(pos, col, rand(-26, 26) * s, rand(0, 0.5) * s, rand(-20, 20) * s, waterColor(0.8 * s, false));
  }
  return fill(pos, col);
}

/*
 * genGlobe — a wireframe globe with a handful of beacon points and
 * connecting great-circle arcs. Generic placements (no real site data).
 */
export function genGlobe(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const lonOff = (35 * Math.PI) / 180;

  function onGlobe(latDeg: number, lonDeg: number, rr: number): [number, number, number] {
    const la = (latDeg * Math.PI) / 180;
    const lo = (lonDeg * Math.PI) / 180 + lonOff;
    return [rr * Math.cos(la) * Math.sin(lo), rr * Math.sin(la), rr * Math.cos(la) * Math.cos(lo)];
  }

  const STEEL: RGB = hexToRgb(0x60a5fa);
  const STEEL2 = jitter(GRAPE, 0);

  // Faint sphere shell
  for (let i = 0; i < HERO_POINT_COUNT * 0.22; i++) {
    const th = rand(0, Math.PI * 2);
    const ph = Math.acos(rand(-1, 1));
    push(pos, col, R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th), jitter(STEEL2, 0.45));
  }
  // Latitude rings (equator brighter)
  for (let la = -75; la <= 75; la += 15) {
    const n = 90;
    for (let i = 0; i < n; i++) {
      const v = onGlobe(la, (i / n) * 360, R);
      push(pos, col, v[0] + rand(-0.02, 0.02) * R, v[1] + rand(-0.02, 0.02) * R, v[2] + rand(-0.02, 0.02) * R, jitter(la === 0 ? STEEL : STEEL2, 0.18));
    }
  }
  // Meridians
  for (let lo = 0; lo < 360; lo += 12) {
    for (let i = 0; i < 32; i++) {
      const la = -82 + (i / 31) * 164;
      const v = onGlobe(la, lo, R);
      push(pos, col, v[0], v[1], v[2], jitter(STEEL2, 0.22));
    }
  }
  // Beacons — generic positions (not real client/site data)
  const BEACON_LAT_LON: [number, number, boolean][] = [
    [40.7, 0, true],
    [28.5, -55, false],
    [51.5, 60, false],
    [-33.9, 140, false],
    [35.7, -140, false],
    [55.8, 20, false],
  ];
  const HOME: RGB = hexToRgb(0xff9eb4);
  const beacons: [number, number, number][] = [];
  for (const [la, lo, home] of BEACON_LAT_LON) {
    const v = onGlobe(la, lo, R);
    beacons.push(v);
    for (let i = 0; i < HERO_POINT_COUNT * 0.012; i++) {
      const vv = onGlobe(la, lo, R + rand(0, 0.25) * R);
      push(pos, col, vv[0] + rand(-0.015, 0.015) * R, vv[1] + rand(-0.015, 0.015) * R, vv[2] + rand(-0.015, 0.015) * R, jitter(home ? HOME : AMBER, 0.15));
    }
  }
  // Great-circle arcs, home to everywhere
  const home = norm(beacons[0]);
  for (let bi = 1; bi < beacons.length; bi++) {
    const dst = norm(beacons[bi]);
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(home, dst))));
    const sa = Math.sin(ang);
    if (sa < 0.001) continue;
    const steps = Math.floor(HERO_POINT_COUNT * 0.02);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const a = Math.sin((1 - t) * ang) / sa;
      const b = Math.sin(t * ang) / sa;
      const vx = home[0] * a + dst[0] * b;
      const vy = home[1] * a + dst[1] * b;
      const vz = home[2] * a + dst[2] * b;
      const rr = R * (1 + 0.18 * Math.sin(Math.PI * t));
      push(pos, col, vx * rr + rand(-0.006, 0.006) * R, vy * rr + rand(-0.006, 0.006) * R, vz * rr + rand(-0.006, 0.006) * R, jitter(TEAL, 0.15));
    }
  }
  // Stars
  while (pos.length / 3 < HERO_POINT_COUNT * 0.98) {
    const r = rand(1.7, 3.2) * R;
    const th = rand(0, Math.PI * 2);
    const ph = Math.acos(rand(-1, 1));
    push(pos, col, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th), jitter(MIST, 0.5));
  }
  return fill(pos, col);
}

function norm(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/*
 * genSkyline — a pseudo-random tower field, pre-construction survey-grid
 * feel. Deterministic-ish layout (LCG) so the silhouette is stable run to
 * run, only the point jitter inside it is random.
 */
export function genSkyline(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 22; // easteregg tuned this at roughly a 22-unit half-span

  const STEEL2: RGB = hexToRgb(0x4c6a92);
  const towers: { x: number; z: number; w: number; h: number }[] = [];
  let seed = 7;
  const srand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed % 1000) / 1000;
  };
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -2; gz <= 2; gz++) {
      if (srand() < 0.22) continue;
      const w = (2.2 + srand() * 2.6) * s;
      const h = (4 + srand() * srand() * 26) * s;
      towers.push({ x: (gx * 7 + (srand() - 0.5) * 2.5) * s, z: (gz * 7 + (srand() - 0.5) * 2.5) * s, w, h });
    }
  }
  const hero = towers.reduce((a, b) => (b.h > a.h ? b : a), towers[0]);
  const perTower = Math.floor((HERO_POINT_COUNT * 0.7) / towers.length);
  for (const t of towers) {
    const isHero = t === hero;
    for (let i = 0; i < perTower; i++) {
      const face = Math.floor(rand(0, 4));
      let x = 0;
      let z = 0;
      const hw = t.w / 2;
      if (face === 0) {
        x = -hw;
        z = rand(-hw, hw);
      } else if (face === 1) {
        x = hw;
        z = rand(-hw, hw);
      } else if (face === 2) {
        z = -hw;
        x = rand(-hw, hw);
      } else {
        z = hw;
        x = rand(-hw, hw);
      }
      const y = rand(0, t.h) - t.h / 2; // center vertically on the bounding sphere
      const band = Math.abs((y + t.h / 2) % (1.4 * s) - 0.12 * s) < 0.14 * s;
      const base = isHero ? (band ? TEAL : hexToRgb(0x1f8f82)) : band ? AMBER : STEEL2;
      push(pos, col, t.x + x, y, t.z + z, jitter(base, 0.18));
    }
    for (let i = 0; i < HERO_POINT_COUNT * 0.006; i++) {
      push(pos, col, t.x + rand(-t.w / 2, t.w / 2), t.h / 2, t.z + rand(-t.w / 2, t.w / 2), jitter(SNOW, 0.2));
    }
  }
  while (pos.length / 3 < HERO_POINT_COUNT * 0.98) {
    const onX = Math.random() < 0.5;
    const line = Math.floor(rand(-3, 4)) * 7 * s + 3.5 * s;
    if (onX) push(pos, col, rand(-26, 26) * s, -8 * s, line + rand(-0.25, 0.25) * s, jitter(STEEL2, 0.3));
    else push(pos, col, line + rand(-0.25, 0.25) * s, -8 * s, rand(-19, 19) * s, jitter(STEEL2, 0.3));
  }
  return fill(pos, col);
}

/*
 * The remaining forms retain the compositions from the Agile Lens piece,
 * scaled and centered for this hero's radius-based camera framing. As above,
 * each one deliberately spends its remaining budget through fill(), rather
 * than changing the number of vertices a morph has to interpolate.
 */

export function genTheater(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 23;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, (y - 8) * s, z * s, c);
  const VELVET = hexToRgb(0x7c3f63);
  const PLASTER = hexToRgb(0xececf6);
  const GILT = AMBER;

  for (let i = 0; i < 3000; i++) put(rand(-13, 13), 0.15 + rand(0, 14.8) * 0.006, rand(-19, -4.2), jitter(hexToRgb(0x312b43), 0.1));
  for (let i = 0; i < 1500; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    put(side * rand(13.4, 14.6), rand(0, 12), rand(-4.6, -3.6), jitter(PLASTER, 0.12));
  }
  for (let i = 0; i < 1300; i++) put(rand(-14.6, 14.6), rand(12, 14.2), rand(-4.6, -3.6), jitter(PLASTER, 0.12));
  for (let i = 0; i < 700; i++) {
    const t = Math.random();
    const [x, y] = t < 0.4 ? [-13.3, rand(0.2, 12)] : t < 0.8 ? [13.3, rand(0.2, 12)] : [rand(-13.3, 13.3), 11.9];
    put(x + rand(-0.12, 0.12), y, -4 + rand(-0.1, 0.1), jitter(GILT, 0.15));
  }
  for (let i = 0; i < 1400; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const u = rand(0, 1);
    const x = side * (13.2 - u * 4.4);
    put(x, rand(Math.max(0.2, 9.5 - u * 9), 11.9), -4.1 + Math.sin(x * 2.4) * 0.28, jitter(VELVET, 0.16));
  }
  const seats: [number, number, number][] = [];
  for (let row = 0; row < 13; row++) {
    const half = 11.5 - Math.max(0, row - 8) * 0.5;
    for (let x = -half; x <= half; x += 1.35) if (Math.abs(x) >= 1 || row === 12) seats.push([x + rand(-0.1, 0.1), 0.35 + row * 0.42, 0.8 + row * 1.75]);
  }
  for (let row = 0; row < 5; row++) for (let x = -10.5; x <= 10.5; x += 1.35) if (Math.abs(x) >= 1) seats.push([x + rand(-0.1, 0.1), 6.8 + row * 0.85, 14.5 + row * 1.8]);
  const perSeat = Math.max(3, Math.floor(6200 / seats.length));
  for (const [x, y, z] of seats) for (let i = 0; i < perSeat; i++) put(x + rand(-0.32, 0.32), y + rand(0, 0.85), z + rand(-0.28, 0.28), jitter(Math.random() < 0.85 ? VELVET : GRAPE, 0.14));
  for (let i = 0; i < 500; i++) put(rand(-11.5, 11.5), 6.4 + rand(-0.08, 0.3), 13.8 + rand(0, 0.46), jitter(GILT, 0.18));
  for (let i = 0; i < 2400; i++) {
    const z = rand(-19, 22);
    const pilaster = Math.abs(((z + 19) % 6) - 3) < 0.4;
    put((Math.random() < 0.5 ? -1 : 1) * (15.6 + (pilaster ? -0.35 : 0)), rand(0, 13.5), z, jitter(pilaster ? GILT : PLASTER, 0.14));
  }
  for (let i = 0; i < 1600; i++) {
    const x = rand(-15.5, 15.5), z = rand(-4, 22);
    put(x, 14.4 + Math.max(0, 2.2 - Math.hypot(x, z - 9) * 0.12), z, jitter(PLASTER, 0.1));
  }
  for (let i = 0; i < 1200; i++) {
    const tier = Math.floor(rand(0, 3)), rr = [2.4, 1.7, 1][tier] * Math.sqrt(Math.random()), th = rand(0, Math.PI * 2);
    put(Math.cos(th) * rr, 12.6 - tier * 0.9 - rand(0, 0.5), 8 + Math.sin(th) * rr, jitter(SNOW, 0.2));
  }
  return fill(pos, col);
}

export function genScan(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 31;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, (y - 5.5) * s, z * s, c);
  const PINE = hexToRgb(0x3f7a58), PINE2 = hexToRgb(0x2e5f46), LEAF = hexToRgb(0x6fae72), MOSS = hexToRgb(0x8aa86a), GRASS = hexToRgb(0xa8bf7e), BARK = hexToRgb(0x8a6a4f), BIRCH = hexToRgb(0xd8cfc0);
  const hill = (x: number, z: number) => Math.max(0.25, 2.3 * Math.sin(x * 0.085 + 1.2) * Math.cos(z * 0.07) + 1.5 * Math.sin(x * 0.16 + z * 0.13 + 0.5) + 0.7 * Math.sin(x * 0.31 - z * 0.27) + 2.6);
  for (let i = 0; i < 7200; i++) {
    const x = rand(-30, 30), z = rand(-26, 26), y = hill(x, z);
    put(x, y + rand(-0.12, 0.12), z, jitter(lerpRgb(MOSS, GRASS, Math.min(1, y / 6)), 0.16));
  }
  const trees: { x: number; z: number; scale: number; conifer: boolean; birch: boolean }[] = [];
  let seed = 31;
  const srand = () => ((seed = (seed * 16807) % 2147483647) % 1000) / 1000;
  for (let n = 0; n < 240 && trees.length < 64; n++) {
    const x = (srand() - 0.5) * 56, z = (srand() - 0.5) * 48;
    if (Math.hypot(x, z) >= 5.5 && !trees.some((tree) => Math.hypot(tree.x - x, tree.z - z) < 3.4)) trees.push({ x, z, scale: 0.8 + srand() * 1.5, conifer: srand() < 0.62, birch: srand() < 0.25 });
  }
  const perTree = Math.floor(11000 / trees.length);
  for (const tree of trees) {
    const ground = hill(tree.x, tree.z), height = 5.5 * tree.scale, trunk = Math.floor(perTree * 0.22);
    for (let i = 0; i < trunk; i++) {
      const u = Math.random(), rr = 0.22 * tree.scale * (1 - u * 0.4) * Math.sqrt(Math.random()), th = rand(0, Math.PI * 2);
      put(tree.x + Math.cos(th) * rr, ground + u * height * (tree.conifer ? 0.45 : 0.55), tree.z + Math.sin(th) * rr, jitter(tree.birch ? BIRCH : BARK, 0.2));
    }
    for (let i = 0; i < perTree - trunk; i++) {
      if (tree.conifer) {
        const u = Math.random(), rr = 1.9 * tree.scale * (1 - u) * Math.sqrt(Math.random()), th = rand(0, Math.PI * 2);
        put(tree.x + Math.cos(th) * rr, ground + height * (0.3 + u * 0.75), tree.z + Math.sin(th) * rr, jitter(u > 0.85 ? PINE : Math.random() < 0.5 ? PINE : PINE2, 0.2));
      } else {
        const branch = i % 3, rr = (1.5 + (branch === 0 ? 0.5 : 0)) * tree.scale * Math.cbrt(Math.random()), th = rand(0, Math.PI * 2), ph = Math.acos(rand(-1, 1));
        put(tree.x + Math.sin(branch * 2.4) * 0.9 * tree.scale + rr * Math.sin(ph) * Math.cos(th), ground + height * 0.62 + (branch - 1) * 0.5 * tree.scale + rr * Math.cos(ph) * 0.8, tree.z + Math.cos(branch * 2.7) * 0.9 * tree.scale + rr * Math.sin(ph) * Math.sin(th), jitter(LEAF, 0.22));
      }
    }
  }
  for (let i = 0; i < 1600; i++) {
    const x = rand(-30, 30), z = rand(-26, 26), y = hill(x, z);
    if (y <= 3.2) put(x, y + rand(0.4, 1.8), z, jitter(TEAL, 0.4));
  }
  return fill(pos, col);
}

export function genHeadset(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 14;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, y * s, z * s, c);
  const W = 5.6, H = 2.15, D = 1.5, exp = 3.2;
  const superellipse = (x: number, y: number) => Math.pow(Math.abs(x / W), exp) + Math.pow(Math.abs(y / H), exp);
  const edge = (angle: number): [number, number] => {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const d = Math.pow(Math.pow(Math.abs(cos / W), exp) + Math.pow(Math.abs(sin / H), exp), 1 / exp);
    return [cos / d, sin / d];
  };
  const faceZ = (x: number, y: number) => D - x * x * 0.045 - y * y * 0.05;
  const shell = SNOW, graphite = MIST, tan = AMBER;
  for (let i = 0; i < 5000; i++) {
    const x = rand(-W, W), y = rand(-H, H);
    if (superellipse(x, y) <= 1) put(x * 2, y * 2, (faceZ(x, y) + rand(-0.04, 0.04)) * 2, jitter(shell, 0.08));
  }
  for (let i = 0; i < 4200; i++) { const [x, y] = edge(rand(0, Math.PI * 2)); put(x * 2, y * 2, rand(-D * 0.9, faceZ(x, y)) * 2, jitter(tan, 0.12)); }
  for (let i = 0; i < 2400; i++) { const [x, y] = edge(rand(0, Math.PI * 2)); const scale = rand(0.83, 0.9); put(x * scale * 2, y * scale * 2, (-D * 0.9 + rand(-0.12, 0.12)) * 2, jitter(graphite, 0.15)); }
  for (const side of [-1, 1]) for (let i = 0; i < 1100; i++) {
    const angle = rand(0, Math.PI * 2), ring = Math.random() < 0.55, rr = ring ? 1.05 + rand(-0.06, 0.06) : Math.sqrt(Math.random());
    put((side * 2.55 + Math.cos(angle) * rr) * 2, (Math.sin(angle) * rr * 0.95 - 0.05) * 2, -D * 1.44, jitter(ring ? TEAL : hexToRgb(0x164e63), 0.2));
  }
  for (const [x, y] of [[-4.1, 1.15], [4.1, 1.15], [-4.4, -1.2], [4.4, -1.2], [0, -0.2]]) for (let i = 0; i < 260; i++) {
    const angle = rand(0, Math.PI * 2), rr = 0.34 * Math.sqrt(Math.random());
    put((x + Math.cos(angle) * rr) * 2, (y + Math.sin(angle) * rr) * 2, (faceZ(x, y) + 0.06) * 2, jitter(graphite, 0.18));
  }
  for (let i = 0; i < 5000; i++) { const angle = rand(0.55, Math.PI * 2 - 0.55); put(Math.sin(angle) * 9.4, rand(-0.8, 1.2), (0.55 - 4.6 + Math.cos(angle) * 4.6) * 2, jitter(tan, 0.12)); }
  for (let i = 0; i < 1300; i++) { const u = Math.random(); put(rand(-1, 1), (H * 0.4 + Math.sin(u * Math.PI) * 3.2) * 2, (D * 0.3 - u * (D * 0.3 + 3.85)) * 2, jitter(tan, 0.14)); }
  return fill(pos, col);
}

export function genMarquee(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 25;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, (y - 7.5) * s, z * s, c);
  const glyphs: Record<string, string[]> = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
  };
  const word = "ALEX", cell = 1.25, start = -(word.length * 6 * cell) / 2;
  for (let gi = 0; gi < word.length; gi++) for (let row = 0; row < 7; row++) for (let column = 0; column < 5; column++) {
    if (glyphs[word[gi]][row][column] !== "1") continue;
    const base = lerpRgb(TEAL, gi > 1 ? AMBER : SNOW, gi / (word.length - 1));
    for (let i = 0; i < 520; i++) put(start + gi * 6 * cell + column * cell + rand(-0.45, 0.45), 10.8 - row * cell + rand(-0.45, 0.45), rand(-0.55, 0.55), jitter(base, 0.12));
  }
  const border: [number, number][] = [];
  for (let x = -25; x <= 25; x += 1.15) { border.push([x, 1.6], [x, 13.4]); }
  for (let y = 2.75; y < 13.4; y += 1.15) { border.push([-25, y], [25, y]); }
  for (const [x, y] of border) for (let i = 0; i < 12; i++) { const a = rand(0, Math.PI * 2), rr = 0.22 * Math.sqrt(Math.random()); put(x + Math.cos(a) * rr, y + Math.sin(a) * rr, rand(-0.1, 0.1), jitter(AMBER, 0.15)); }
  return fill(pos, col);
}

export function genGuitar(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 17;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, (y - 11.5) * s, z * s, c);
  const halfWidth = (y: number) => Math.max(0, 4.3 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 4) / 4.3, 2))), 3.2 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 9.3) / 3.2, 2))));
  const WOOD = hexToRgb(0xc69b63), DARK = hexToRgb(0x312b43);
  for (let i = 0; i < 2600; i++) { const y = rand(-0.28, 12.5), w = halfWidth(y); if (w > 0.25) put((Math.random() < 0.5 ? -1 : 1) * w + rand(-0.06, 0.06), y, rand(-1.2, 1.2), jitter(AMBER, 0.18)); }
  const holeY = 7.3, holeR = 1.35;
  for (let i = 0; i < 4200; i++) { const y = rand(-0.2, 12.4), w = halfWidth(y), x = rand(-w, w); if (w > 0.25 && Math.hypot(x, y - holeY) >= holeR) put(x, y, 1.2 + rand(-0.05, 0.05), jitter(WOOD, 0.1)); }
  for (let i = 0; i < 500; i++) { const a = rand(0, Math.PI * 2), rr = holeR + 0.12 + rand(0, 0.22); put(Math.cos(a) * rr, holeY + Math.sin(a) * rr, 1.28, jitter(AMBER, 0.15)); }
  for (let i = 0; i < 1500; i++) put(rand(-0.68, 0.68), rand(12.2, 21), rand(0.85, 1.3), jitter(DARK, 0.18));
  for (let fret = 12.6, gap = 1.05; fret < 20.9; gap *= 0.944, fret += gap) for (let i = 0; i < 46; i++) put(rand(-0.68, 0.68), fret + rand(-0.03, 0.03), 1.33, jitter(AMBER, 0.12));
  for (let i = 0; i < 620; i++) put(rand(-1, 1), rand(21, 23.6), rand(0.8, 1.25), jitter(GRAPE, 0.15));
  for (let string = 0; string < 6; string++) for (let i = 0; i < 190; i++) put(-0.5 + string * 0.2 + rand(-0.015, 0.015), rand(3.6, 21), 1.42, jitter(SNOW, 0.12));
  return fill(pos, col);
}

export function genDominoes(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 17;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, x * s, (y - 1.25) * s, z * s, c);
  const path = (t: number): [number, number] => [Math.sin(t * Math.PI * 1.5) * 13, -15 + t * 30];
  for (let tile = 0; tile < 26; tile++) {
    const t = tile / 25, origin = path(t), before = path(Math.max(0, t - 0.005)), after = path(Math.min(1, t + 0.005));
    let tx = after[0] - before[0], tz = after[1] - before[1]; const length = Math.hypot(tx, tz); tx /= length; tz /= length;
    const tilt = tile < 11 ? Math.PI / 2 - 0.06 : tile < 16 ? (1 - (tile - 10) / 6) * Math.PI / 2 : 0, cos = Math.cos(tilt), sin = Math.sin(tilt), falling = tile >= 11 && tile < 16;
    for (let i = 0; i < 620; i++) {
      const face = Math.random();
      const a = face < 0.7 ? (face < 0.42 ? 0.18 : -0.18) : rand(-0.18, 0.18), b = face < 0.7 ? rand(-0.72, 0.72) : (Math.random() < 0.5 ? -0.72 : 0.72), h = rand(0, 2.5);
      const a2 = a * cos + h * sin, h2 = -a * sin + h * cos;
      put(origin[0] + tx * a2 - tz * b, Math.max(0.03, h2), origin[1] + tz * a2 + tx * b, jitter(falling ? TEAL : SNOW, 0.12));
    }
    for (let i = 0; i < (3 + (tile % 6)) * 14; i++) { const pip = i % (3 + (tile % 6)), b = -0.5 + pip / Math.max(1, 2 + (tile % 6)) + rand(-0.05, 0.05), h = (pip % 2 === 0 ? 0.7 : 1.8) + rand(-0.05, 0.05); put(origin[0] + tx * (0.2 * cos + h * sin) - tz * b, Math.max(0.03, -0.2 * sin + h * cos), origin[1] + tz * (0.2 * cos + h * sin) + tx * b, jitter(GRAPE, 0.12)); }
  }
  for (let i = 0; i < 900; i++) { const [x, z] = path(Math.random()); put(x + rand(-0.4, 0.4), 0.03, z + rand(-0.4, 0.4), jitter(MIST, 0.3)); }
  return fill(pos, col);
}

export function genMonocle(R: number): FormData {
  const pos: number[] = [];
  const col: number[] = [];
  const s = R / 12;
  const put = (x: number, y: number, z: number, c: RGB) => push(pos, col, (x - 2.5) * s, (y - 8) * s, z * s, c);
  const radius = 7.2, tube = 0.38;
  for (let i = 0; i < 6200; i++) { const a = rand(0, Math.PI * 2), b = rand(0, Math.PI * 2), rr = radius + tube * Math.cos(b); put(Math.cos(a) * rr, 11.5 + Math.sin(a) * rr, tube * Math.sin(b), jitter(AMBER, 0.14)); }
  for (let i = 0; i < 1200; i++) { const a = rand(0, Math.PI * 2), rr = radius - 0.5 + rand(-0.05, 0.05); put(Math.cos(a) * rr, 11.5 + Math.sin(a) * rr, 0.18, jitter(SNOW, 0.15)); }
  for (let i = 0; i < 5200; i++) { const a = rand(0, Math.PI * 2), rr = (radius - 0.6) * Math.pow(Math.random(), 0.35); put(Math.cos(a) * rr, 11.5 + Math.sin(a) * rr, 0.5 * (1 - (rr / radius) ** 2) + rand(-0.04, 0.04), jitter(Math.random() < 0.8 ? MIST : TEAL, 0.35)); }
  for (let i = 0; i < 1100; i++) { const a = rand(Math.PI * 0.55, Math.PI * 0.95), rr = radius - 1.5 + rand(-0.5, 0.5); put(Math.cos(a) * rr, 11.5 + Math.sin(a) * rr, 0.55, jitter(SNOW, 0.1)); }
  const attachAngle = -Math.PI * 0.22, startX = Math.cos(attachAngle) * (radius + 0.5), startY = 11.5 + Math.sin(attachAngle) * (radius + 0.5), endX = startX + 6.5, endY = 1.6;
  for (let link = 0; link < 15; link++) {
    const u = link / 14, cx = startX + (endX - startX) * u, cy = startY - 0.5 + (endY - (startY - 0.5)) * u - Math.sin(u * Math.PI) * 2.6, vertical = link % 2 === 0;
    for (let i = 0; i < 240; i++) { const a = rand(0, Math.PI * 2), b = rand(0, Math.PI * 2), rr = 0.42 + 0.09 * Math.cos(b), ax = Math.cos(a) * rr, ay = Math.sin(a) * rr * 1.4; put(cx + ax, vertical ? cy + ay : cy + 0.09 * Math.sin(b) * 1.4, vertical ? 0.09 * Math.sin(b) : ay * 0.7, jitter(AMBER, 0.16)); }
  }
  for (let i = 0; i < 400; i++) put(endX + rand(-0.9, 0.9), endY + rand(-0.12, 0.12), rand(-0.12, 0.12), jitter(AMBER, 0.14));
  return fill(pos, col);
}

export type HeroShapeKey = "scan" | "theater" | "headset" | "skyline" | "marquee" | "guitar" | "wave" | "globe" | "dominoes" | "monocle";

export const HERO_SHAPE_ORDER: HeroShapeKey[] = ["scan", "theater", "headset", "skyline", "marquee", "guitar", "wave", "globe", "dominoes", "monocle"];

export const HERO_SHAPE_LABELS: Record<HeroShapeKey, string> = {
  scan: "Forest Scan",
  theater: "Theater",
  headset: "Headset",
  skyline: "Skyline",
  marquee: "Marquee",
  guitar: "Guitar",
  wave: "The Wave",
  globe: "World Tour",
  dominoes: "Dominoes",
  monocle: "Monocle",
};

const GENERATORS: Record<HeroShapeKey, (R: number) => FormData> = {
  scan: genScan,
  theater: genTheater,
  headset: genHeadset,
  marquee: genMarquee,
  guitar: genGuitar,
  wave: genWave,
  globe: genGlobe,
  skyline: genSkyline,
  dominoes: genDominoes,
  monocle: genMonocle,
};

export function generateHeroShape(key: HeroShapeKey, R: number): FormData {
  return GENERATORS[key](R);
}
