// Link-node layer for the canvas particle fields (FaceField, ParticleField).
//
// It turns a handful of dots into a navigable knowledge graph: each link node
// drifts with the ambient field until you point at it, then it LOCKS in place
// while a shockwave shoves the surrounding dots outward and a clearance
// bubble holds them back so the tooltip stays readable.
//
// Deliberately framework-free and canvas-agnostic: the host component owns the
// particle array, the RAF loop and the DOM hit-targets, and calls
// update()/draw() from inside its existing frame. Nothing here touches React,
// so both particle fields can adopt it without their physics being rewritten.
//
// Motion notes (the "gamefeel" is mostly in these numbers):
//   · Locking is a damped spring at ratio 0.75, not a snap. Measured against
//     tests/link-nodes.test.ts: a 40px displacement is ~75% recovered at
//     200ms and settled by 300ms, and a node travelling 166px/s is arrested
//     inside 7px. Fast enough to read as "grabbed", slow enough to see.
//   · The push is TWO effects, and it needs both to read as physical: a
//     travelling impulse ring (you can see it leave the node) plus a
//     sustained, eased-in clearance field (the hole persists while you hover
//     and closes when you leave).
//   · Impulses are expressed in the host's per-frame velocity units and
//     scaled by dt*60, so a 120Hz display feels the same as a 60Hz one.

import type { HeroLink } from "@/lib/heroLinks";

/** Minimal shape this layer needs from the host's particle array. */
export type FieldParticle = { x: number; y: number; vx: number; vy: number };

/**
 * Where the hero's immovable furniture actually is, measured per resize.
 * `cutoutTop`/`cutoutLeft` should be the hero's own height/width when the
 * portrait is hidden, so the bands simply reclaim that space.
 */
export type HeroBounds = {
  navBottom: number;
  cutoutTop: number;
  cutoutLeft: number;
  enabled: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export type LinkNodeRuntime = {
  link: HeroLink;
  /** Home position in px, recomputed on resize. */
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0→1 activation ease (hover/lock strength). */
  act: number;
  /** Position captured the instant it locked. */
  lockX: number;
  lockY: number;
  /** Per-node phase so wander and pulse never sync up across the field. */
  phase: number;
};

type Wave = { x: number; y: number; t: number };

// ── Tuning ──────────────────────────────────────────────────
const WANDER_AMP = 26;       // px of idle drift around home
const HOME_K = 2.2;          // spring constant back to the wander target
const HOME_DAMP = 2.4;
const LOCK_K = 150;          // spring constant to the captured lock point
const LOCK_RATIO = 0.75;     // damping ratio — <1 gives a little overshoot
const POINTER_R = 118;       // link nodes dodge the cursor, like ambient dots
const POINTER_F = 26;
const POINTER_HOLD = 62;     // inside this the dodge fades so nodes stay catchable
const ACT_IN = 15;           // activation ease-in rate (per second)
const ACT_OUT = 7;

const WAVE_SPEED = 690;      // px/s the impulse ring travels outward
const WAVE_BAND = 96;        // px thickness of the ring
const WAVE_DECAY = 2.3;      // amplitude e-folding rate
const WAVE_IMPULSE = 2.9;    // per-frame velocity added at the ring's crest
const WAVE_NODE_FACTOR = 0.3; // other link nodes are "heavier" than dust

const CLEAR_R = 132;         // sustained bubble radius around a locked node
const CLEAR_F = 0.62;

const NODE_R = 3.1;          // core dot radius (ambient dots are 0.6–2.2)
const BAND_PAD = 40;         // breathing room at a band's ends
const EDGE_PAD = 44;         // hard keep-out from the hero's own edges
// Minimum gap below the nav: half a hit-target (22) plus the vertical wander
// (18). Deliberately smaller than EDGE_PAD — reusing EDGE_PAD here set a floor
// of 70px that exceeded every top-band inset and flattened the whole band onto
// a single line.
const NAV_CLEAR = 40;

export class LinkNodeLayer {
  nodes: LinkNodeRuntime[] = [];
  private waves: Wave[] = [];
  private t = 0;
  private activeIndex: number | null = null;
  private w = 0;
  private h = 0;
  private reduced: boolean;
  private links: HeroLink[];

  // Explicit fields rather than TS parameter properties: `node --test` strips
  // types without transforming, and parameter properties are real emit.
  constructor(links: HeroLink[], opts: { reduced?: boolean } = {}) {
    this.links = links;
    this.reduced = opts.reduced ?? false;
  }

  /**
   * Recompute homes against the hero's *measured* obstacles. Pass
   * `enabled: false` to stand the whole layer down (small screens), which
   * empties `nodes` so update/draw become no-ops and the host renders no
   * hit-targets at all.
   */
  resize(w: number, h: number, bounds: HeroBounds) {
    this.w = w;
    this.h = h;
    const visible = bounds.enabled ? this.links : [];

    // Vertical extent each side band may use, and the horizontal extent the
    // floor may use — all derived from where the nav and cutout actually are.
    const top = bounds.navBottom;
    const floorRight = Math.min(bounds.cutoutLeft, w);
    const rightTop = top + BAND_PAD;
    const rightBottom = Math.min(bounds.cutoutTop, h) - BAND_PAD;

    // Preserve live positions across a resize so the field doesn't teleport.
    const previous = new Map(this.nodes.map((n) => [n.link.href, n]));
    this.nodes = visible.map((link, i) => {
      let hx: number;
      let hy: number;
      switch (link.band) {
        case "top":
          hx = BAND_PAD + link.along * (w - 2 * BAND_PAD);
          hy = top + link.inset;
          break;
        case "floor":
          hx = BAND_PAD + link.along * (floorRight - 2 * BAND_PAD);
          hy = h - link.inset;
          break;
        case "right":
          hx = w - link.inset;
          hy = rightTop + link.along * Math.max(0, rightBottom - rightTop);
          break;
        default: // "left"
          hx = link.inset;
          hy = top + BAND_PAD + link.along * Math.max(0, h - top - 2 * BAND_PAD);
          break;
      }
      // Last-resort clamp: never let a home (or its wander) reach under the
      // fixed header, where the node would be invisible and unclickable.
      hx = clamp(hx, EDGE_PAD, w - EDGE_PAD);
      hy = clamp(hy, top + NAV_CLEAR, h - EDGE_PAD);
      const prior = previous.get(link.href);
      return {
        link,
        hx,
        hy,
        x: prior?.x ?? hx,
        y: prior?.y ?? hy,
        vx: prior?.vx ?? 0,
        vy: prior?.vy ?? 0,
        act: prior?.act ?? 0,
        lockX: prior?.lockX ?? hx,
        lockY: prior?.lockY ?? hy,
        phase: prior?.phase ?? (i * 2.399963) % (Math.PI * 2), // golden-angle spread
      };
    });
    if (this.activeIndex !== null && this.activeIndex >= this.nodes.length) {
      this.activeIndex = null;
    }
  }

  /**
   * Drop every node onto its home with no velocity. Used for the one
   * correction right after mount, when the hero's furniture has finished
   * moving: without it the constellation visibly glides ~40px into place as
   * the banner pushes the header down. A later resize should NOT snap — the
   * glide is the right behavior once someone is actually looking.
   */
  snapToHomes() {
    for (const n of this.nodes) {
      n.x = n.hx;
      n.y = n.hy;
      n.vx = 0;
      n.vy = 0;
      n.lockX = n.hx;
      n.lockY = n.hy;
    }
  }

  /** The links currently on screen, in the same order as `nodes`. */
  get visibleLinks(): HeroLink[] {
    return this.nodes.map((n) => n.link);
  }

  get active(): number | null {
    return this.activeIndex;
  }

  /**
   * Hover/lock a node by index, or null to release. Firing a wave here rather
   * than in update() means one wave per activation, no matter the frame rate.
   */
  setActive(index: number | null) {
    if (index === this.activeIndex) return;
    this.activeIndex = index;
    if (index === null) return;
    const n = this.nodes[index];
    if (!n) return;
    n.lockX = n.x;
    n.lockY = n.y;
    if (!this.reduced) this.waves.push({ x: n.x, y: n.y, t: 0 });
  }

  /**
   * Advance the layer and apply its forces to the host's particles.
   * `dt` in seconds; `pointer` in the same px space as the particles.
   */
  update(dt: number, particles: FieldParticle[], pointer: { x: number; y: number }) {
    // A backgrounded tab resumes with a huge dt; clamp so nothing explodes.
    const step = Math.min(dt, 1 / 30);
    const frame = step * 60; // convert per-frame impulse units to this step
    this.t += step;

    if (!this.reduced) {
      this.advanceWaves(step, frame, particles);
      this.applyClearance(frame, particles);
    }
    this.integrateNodes(step, pointer);
  }

  private advanceWaves(step: number, frame: number, particles: FieldParticle[]) {
    const maxR = Math.hypot(this.w, this.h);
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.t += step;
      const ring = wave.t * WAVE_SPEED;
      const amp = Math.exp(-wave.t * WAVE_DECAY);
      if (amp < 0.03 || ring - WAVE_BAND > maxR) {
        this.waves.splice(i, 1);
        continue;
      }
      for (const p of particles) {
        const dx = p.x - wave.x;
        const dy = p.y - wave.y;
        const d = Math.hypot(dx, dy) || 1;
        const off = Math.abs(d - ring);
        if (off > WAVE_BAND) continue;
        const f = amp * (1 - off / WAVE_BAND) * WAVE_IMPULSE * frame;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      // Other link nodes get shoved too, but they carry more mass.
      for (const n of this.nodes) {
        const dx = n.x - wave.x;
        const dy = n.y - wave.y;
        const d = Math.hypot(dx, dy);
        if (d < 1) continue;
        const off = Math.abs(d - ring);
        if (off > WAVE_BAND) continue;
        const f = amp * (1 - off / WAVE_BAND) * WAVE_IMPULSE * WAVE_NODE_FACTOR * frame * 60;
        n.vx += (dx / d) * f;
        n.vy += (dy / d) * f;
      }
    }
  }

  /** Holds a readable hole open around the locked node for as long as it's held. */
  private applyClearance(frame: number, particles: FieldParticle[]) {
    for (const n of this.nodes) {
      if (n.act < 0.01) continue;
      const R = CLEAR_R * n.act;
      for (const p of particles) {
        const dx = p.x - n.x;
        const dy = p.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > R * R || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const t = 1 - d / R;
        const f = t * t * CLEAR_F * n.act * frame;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
  }

  private integrateNodes(step: number, pointer: { x: number; y: number }) {
    const lockDamp = 2 * LOCK_RATIO * Math.sqrt(LOCK_K);
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const isActive = i === this.activeIndex;

      // Activation ease. Exponential approach is frame-rate independent.
      const target = isActive ? 1 : 0;
      const rate = isActive ? ACT_IN : ACT_OUT;
      n.act += (target - n.act) * (1 - Math.exp(-step * rate));

      if (this.reduced) {
        // No drift, no easing — the node is where it lives and the highlight
        // is simply on or off. One redraw per activation is all the host needs.
        n.act = target;
        n.x = n.hx;
        n.y = n.hy;
        continue;
      }

      let tx: number;
      let ty: number;
      let k: number;
      let c: number;
      if (isActive) {
        // Locked: spring hard to the position it held when you arrived.
        tx = n.lockX;
        ty = n.lockY;
        k = LOCK_K;
        c = lockDamp;
      } else {
        // Idle: wander a little around home, spring back loosely.
        tx = n.hx + Math.sin(this.t * 0.21 + n.phase) * WANDER_AMP;
        ty = n.hy + Math.cos(this.t * 0.17 + n.phase * 1.3) * WANDER_AMP * 0.7;
        k = HOME_K;
        c = HOME_DAMP;

        // Same cursor dodge the ambient dots have, so nodes read as part of
        // the field rather than as pinned UI.
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < POINTER_R * POINTER_R && d2 > 0) {
          const d = Math.sqrt(d2);
          // Ramp the dodge back down inside POINTER_HOLD so a node flinches as
          // you sweep past but never flees a cursor deliberately closing on it
          // — an unclickable link is a worse outcome than a stiffer field.
          const f = (1 - d / POINTER_R) * Math.min(1, d / POINTER_HOLD) * POINTER_F;
          n.vx += (dx / d) * f * step;
          n.vy += (dy / d) * f * step;
        }
      }

      n.vx += ((tx - n.x) * k - n.vx * c) * step;
      n.vy += ((ty - n.y) * k - n.vy * c) * step;
      n.x += n.vx * step;
      n.y += n.vy * step;
    }
  }

  /** Draw edges, wavefronts and nodes. Call after the ambient field is drawn. */
  draw(ctx: CanvasRenderingContext2D) {

    // Travelling wavefronts — faint, but they make the push legible.
    for (const wave of this.waves) {
      const ring = wave.t * WAVE_SPEED;
      const amp = Math.exp(-wave.t * WAVE_DECAY);
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, ring, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(174, 90%, 72%, ${amp * 0.16})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // Constellation edges between link nodes.
    const edgeDist = Math.min(this.w, this.h) * 0.42;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > edgeDist) continue;
        const lift = Math.max(a.act, b.act);
        const alpha = (1 - dist / edgeDist) * (0.1 + lift * 0.5);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `hsla(${a.link.hue}, 80%, 70%, ${alpha})`;
        ctx.lineWidth = 1 + lift * 0.8;
        ctx.stroke();
      }
    }

    for (const n of this.nodes) {
      const { hue } = n.link;
      // Slow breathing so a link node never reads as inert dust.
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 1.5 + n.phase);
      const r = NODE_R * (1 + n.act * 0.55);
      const haloR = r * (3.4 + n.act * 3.6 + pulse * 0.5);

      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
      halo.addColorStop(0, `hsla(${hue}, 90%, 72%, ${0.3 + n.act * 0.42})`);
      halo.addColorStop(1, `hsla(${hue}, 90%, 72%, 0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      if (n.act > 0.01) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8 + n.act * 7, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 92%, 76%, ${n.act * 0.55})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 95%, ${78 + n.act * 12}%, ${0.85 + n.act * 0.15})`;
      ctx.fill();
    }
  }
}
