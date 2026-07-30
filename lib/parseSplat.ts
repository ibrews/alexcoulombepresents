// ── .splat file parsing ──────────────────────────────────────────────────────
//
// Hand-rolled parser for the antimatter15 ".splat" format: a flat array of
// 32-byte records, no header. True Gaussian-splat rendering (via a library
// like @mkkellogg/gaussian-splats-3d) can't morph its internal buffers
// cleanly, so SplatHero reads this file itself and hands the result to a
// THREE.Points cloud instead — see components/SplatHero.tsx.
//
// Record layout (32 bytes):
//   offset  0  float32[3]  position (x, y, z)
//   offset 12  float32[3]  scale    (unused here — no per-splat sizing, the
//                                     point cloud uses one shader-driven size)
//   offset 24  uint8[4]    color    (r, g, b, a)
//   offset 28  uint8[4]    rotation (quaternion — unused, splats become dots)

import { HERO_POINT_COUNT } from "./heroShapes";

const STRIDE = 32;
const MIN_ALPHA = 40; // drop near-transparent splats — capture noise/haze

/*
 * This capture's raw coordinate frame has "up" pointing mostly along -Y with
 * a slight -Z lean, not +Y — confirmed empirically: the old viewer set
 * `cameraUp: [0, -1, -0.6]` to render it upright (see git history on
 * components/SplatHero.tsx), and a from-scratch numpy re-render at
 * scratchpad/align_test.py confirmed that rotating raw positions by the
 * matrix below (which sends [0,-1,-0.6] to [0,1,0]) reproduces an
 * identical, upright image while using a plain +Y-up camera.
 *
 * We bake that rotation into the parsed data (once, here) rather than
 * fighting with camera.up at render time, so the recentered splat shares a
 * standard Y-up frame with the procedural shapes in heroShapes.ts — required
 * for the group's own rotation drift to read as a clean spin for every form,
 * splat included.
 *
 * This matrix is specific to THIS capture's up-vector. A future hero.splat
 * captured with a different device orientation would need this recomputed
 * (rotate [0,-1,-0.6] analog for the new file to [0,1,0] via
 * THREE.Quaternion.setFromUnitVectors, or re-run align_test.py's approach).
 */
const UP_ALIGN: readonly [readonly number[], readonly number[], readonly number[]] = [
  [1, 0, 0],
  [0, -0.85749293, -0.51449576],
  [0, 0.51449576, -0.85749293],
];

function alignUp(x: number, y: number, z: number): [number, number, number] {
  const m = UP_ALIGN;
  return [
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z,
  ];
}

export type ParsedSplat = {
  pos: Float32Array; // HERO_POINT_COUNT*3, recentered + up-aligned
  col: Float32Array; // HERO_POINT_COUNT*3, 0..1
  radius: number; // p90 radius from center, in the recentered/aligned space
};

/*
 * Parses a raw .splat ArrayBuffer into exactly `HERO_POINT_COUNT` points,
 * up-aligned and recentered around the scene's median position (so it
 * shares an origin + orientation with the generated shapes in
 * heroShapes.ts) and resampled/padded to a fixed count (so morphing against
 * a shape is a straight per-index lerp).
 *
 * Uses a median center and a p90 radius rather than a raw bounding box —
 * splat captures almost always carry a haze of stray low-opacity splats far
 * outside the subject, and min/max would frame that haze instead of the
 * subject (same reasoning the old frameSceneToCamera() used).
 */
export function parseSplatBuffer(buffer: ArrayBuffer): ParsedSplat | null {
  const totalCount = Math.floor(buffer.byteLength / STRIDE);
  if (totalCount < 8) return null;

  const dv = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Pass 1: collect indices that pass the alpha-noise filter, rotating each
  // kept position into the up-aligned frame as we go (needed up front for
  // the median/radius calc, which must happen in the FINAL frame).
  const keptOffsets: number[] = [];
  const rxs: number[] = [];
  const rys: number[] = [];
  const rzs: number[] = [];
  for (let i = 0; i < totalCount; i++) {
    const off = i * STRIDE;
    if (u8[off + 27] < MIN_ALPHA) continue;
    const x = dv.getFloat32(off + 0, true);
    const y = dv.getFloat32(off + 4, true);
    const z = dv.getFloat32(off + 8, true);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
    const [rx, ry, rz] = alignUp(x, y, z);
    keptOffsets.push(off);
    rxs.push(rx);
    rys.push(ry);
    rzs.push(rz);
  }
  if (keptOffsets.length < 8) return null;

  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const cx = median(rxs);
  const cy = median(rys);
  const cz = median(rzs);

  const dists = rxs
    .map((_, k) => Math.hypot(rxs[k] - cx, rys[k] - cy, rzs[k] - cz))
    .sort((a, b) => a - b);
  const radius = dists[Math.floor(dists.length * 0.9)] || 1;

  const keptN = keptOffsets.length;
  const pos = new Float32Array(HERO_POINT_COUNT * 3);
  const col = new Float32Array(HERO_POINT_COUNT * 3);

  const writeColorAt = (i: number, off: number) => {
    col[i * 3] = u8[off + 24] / 255;
    col[i * 3 + 1] = u8[off + 25] / 255;
    col[i * 3 + 2] = u8[off + 26] / 255;
  };

  if (keptN >= HERO_POINT_COUNT) {
    // Jittered-stride subsample: even coverage across the whole array
    // without the cost of a full Fisher-Yates shuffle over ~350k+ points.
    const step = keptN / HERO_POINT_COUNT;
    for (let i = 0; i < HERO_POINT_COUNT; i++) {
      const k = Math.min(keptN - 1, Math.floor(i * step + Math.random() * step));
      pos[i * 3] = rxs[k] - cx;
      pos[i * 3 + 1] = rys[k] - cy;
      pos[i * 3 + 2] = rzs[k] - cz;
      writeColorAt(i, keptOffsets[k]);
    }
  } else {
    // Fewer real splats than the budget (shouldn't happen at 380k source,
    // but stay correct for smaller captures too) — write every real splat,
    // then pad by jittering random existing ones, same contract as fill()
    // in heroShapes.ts.
    for (let i = 0; i < keptN; i++) {
      pos[i * 3] = rxs[i] - cx;
      pos[i * 3 + 1] = rys[i] - cy;
      pos[i * 3 + 2] = rzs[i] - cz;
      writeColorAt(i, keptOffsets[i]);
    }
    for (let i = keptN; i < HERO_POINT_COUNT; i++) {
      const j = Math.floor(Math.random() * keptN);
      const jitterAmt = radius * 0.01;
      pos[i * 3] = rxs[j] - cx + (Math.random() - 0.5) * jitterAmt;
      pos[i * 3 + 1] = rys[j] - cy + (Math.random() - 0.5) * jitterAmt;
      pos[i * 3 + 2] = rzs[j] - cz + (Math.random() - 0.5) * jitterAmt;
      writeColorAt(i, keptOffsets[j]);
    }
  }

  return { pos, col, radius };
}

// The pre-rotated "front, slightly above, raked" approach direction from the
// old viewer's empirically-good default angle ([0.45,-0.28,-1] in raw space),
// carried through the same UP_ALIGN rotation so the camera in SplatHero.tsx
// views the up-aligned data from the identical relative angle.
export const HERO_APPROACH_DIR: [number, number, number] = alignUp(0.45, -0.28, -1);
