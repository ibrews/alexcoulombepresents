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

export type HeroShapeKey = "wave" | "globe" | "skyline";

export const HERO_SHAPE_ORDER: HeroShapeKey[] = ["wave", "globe", "skyline"];

const GENERATORS: Record<HeroShapeKey, (R: number) => FormData> = {
  wave: genWave,
  globe: genGlobe,
  skyline: genSkyline,
};

export function generateHeroShape(key: HeroShapeKey, R: number): FormData {
  return GENERATORS[key](R);
}
