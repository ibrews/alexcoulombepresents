// Link-node layer for the canvas particle fields (FaceField, ParticleField).
//
// It turns a handful of dots into a navigable knowledge graph: each link node
// drifts with the ambient field until you point at it, then it LOCKS in place
// while soft ripples lap outward through the surrounding dots.
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
//   · The ripples are DISPLACEMENTS, not forces, and that distinction is the
//     whole reason they read as water rather than an explosion. See the long
//     note on applyDisplacement() — the force-based first version measured a
//     1500px shove and left a permanent crater around every link.
//   · Nothing accumulates: peak sway is ~9-16px and every dot returns to
//     exactly where the ambient field had it. A crater is not representable.

import type { HeroNodeLink } from "@/lib/heroLinks";

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
  link: HeroNodeLink;
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

type Wave = { x: number; y: number; t: number; amp: number };

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

// Ripples are DISPLACEMENTS in px, not forces — see applyDisplacement().
const WAVE_SPEED = 300;      // px/s the crest travels outward — slow, lapping
const WAVE_DECAY = 0.85;     // amplitude e-folding rate
const RIPPLE_AMP = 7;        // px of sway at the crest of the first ripple
const RIPPLE_SIGMA = 64;     // px half-width of the crest
const RIPPLE_PERIOD = 1.25;  // seconds between ripples while a node is held
const RIPPLE_REPEAT_AMP = 0.62; // later ripples are softer than the first

const BULGE_AMP = 9;         // px the dots ease outward under a held node
const BULGE_SIGMA = 70;

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
  private rippleClock = 0;
  /** Whether any offset is currently applied, so idle frames can early-out. */
  private displacing = false;
  // Per-particle displacement currently applied, so it can be undone exactly.
  // Weak so a reseeded particle array does not pin the old one in memory.
  private offsets = new WeakMap<FieldParticle, { ox: number; oy: number }>();
  private t = 0;
  private activeIndex: number | null = null;
  private w = 0;
  private h = 0;
  private reduced: boolean;
  private links: HeroNodeLink[];

  // Explicit fields rather than TS parameter properties: `node --test` strips
  // types without transforming, and parameter properties are real emit.
  constructor(links: HeroNodeLink[], opts: { reduced?: boolean } = {}) {
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
  get visibleLinks(): HeroNodeLink[] {
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
    if (!this.reduced) {
      this.rippleClock = 0;
      this.waves.push({ x: n.x, y: n.y, t: 0, amp: 1 });
    }
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
      this.advanceWaves(step);
      this.applyDisplacement(particles);
    }
    this.integrateNodes(step, pointer);
  }

  private advanceWaves(step: number) {
    const maxR = Math.hypot(this.w, this.h);
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.t += step;
      if (
        Math.exp(-wave.t * WAVE_DECAY) < 0.04 ||
        wave.t * WAVE_SPEED - RIPPLE_SIGMA * 2 > maxR
      ) {
        this.waves.splice(i, 1);
      }
    }
    // Lapping, not a single bang: while a node is held, keep sending soft
    // ripples out at a slow, regular cadence.
    if (this.activeIndex !== null) {
      this.rippleClock += step;
      if (this.rippleClock >= RIPPLE_PERIOD) {
        this.rippleClock = 0;
        const n = this.nodes[this.activeIndex];
        if (n) this.waves.push({ x: n.x, y: n.y, t: 0, amp: RIPPLE_REPEAT_AMP });
      }
    } else {
      this.rippleClock = 0;
    }
  }

  /**
   * A reversible DISPLACEMENT field, not a force.
   *
   * The first version added velocity — a travelling impulse plus a sustained
   * clearance push — and it was violently wrong: measured, it flung dots
   * 1500px, right off the hero and through the wrap-around, leaving a
   * permanent crater around every link. The reason is structural, not a bad
   * constant. Ambient dots have no home to spring back to, and the host damps
   * them at 0.985/frame (a ~66-frame time constant), so ANY sustained force
   * integrates into a long glide that never comes back.
   *
   * So nothing here touches velocity. Each frame the previous offset is
   * subtracted, a new one is computed from the particle's own undisturbed
   * position, and that is applied. Dots ease out as a ripple passes and ease
   * exactly back behind it — undulation, and a crater is not representable.
   */
  private applyDisplacement(particles: FieldParticle[]) {
    const live = this.nodes.filter((n) => n.act > 0.01);
    // Idle is the common case by far — nobody is hovering anything most of the
    // time. Once the last offset has been unwound there is nothing to do, so
    // don't walk the whole particle array on every frame forever.
    if (live.length === 0 && this.waves.length === 0) {
      if (!this.displacing) return;
      this.displacing = false;
      for (const p of particles) {
        const prev = this.offsets.get(p);
        if (!prev) continue;
        p.x -= prev.ox;
        p.y -= prev.oy;
        this.offsets.delete(p);
      }
      return;
    }
    this.displacing = true;

    for (const p of particles) {
      const prev = this.offsets.get(p);
      if (prev) {
        p.x -= prev.ox;
        p.y -= prev.oy;
      }

      let ox = 0;
      let oy = 0;

      // A soft bulge under the held node, so it reads as having presence.
      for (const n of live) {
        const dx = p.x - n.x;
        const dy = p.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.001 || d > BULGE_SIGMA * 2.5) continue;
        const g = Math.exp(-(d * d) / (BULGE_SIGMA * BULGE_SIGMA));
        const push = BULGE_AMP * n.act * g;
        ox += (dx / d) * push;
        oy += (dy / d) * push;
      }

      // Ripples: a gentle crest that travels outward and passes by.
      for (const wave of this.waves) {
        const dx = p.x - wave.x;
        const dy = p.y - wave.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.001) continue;
        const off = d - wave.t * WAVE_SPEED;
        if (Math.abs(off) > RIPPLE_SIGMA * 2.5) continue;
        const g = Math.exp(-(off * off) / (RIPPLE_SIGMA * RIPPLE_SIGMA));
        const push = RIPPLE_AMP * wave.amp * Math.exp(-wave.t * WAVE_DECAY) * g;
        ox += (dx / d) * push;
        oy += (dy / d) * push;
      }

      if (ox !== 0 || oy !== 0) {
        p.x += ox;
        p.y += oy;
        this.offsets.set(p, { ox, oy });
      } else if (prev) {
        this.offsets.delete(p);
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

    // Travelling crests. Barely there on purpose — the dots' own sway is the
    // effect; this only hints at what is moving them.
    for (const wave of this.waves) {
      const ring = wave.t * WAVE_SPEED;
      const amp = Math.exp(-wave.t * WAVE_DECAY) * wave.amp;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, ring, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(174, 90%, 72%, ${amp * 0.07})`;
      ctx.lineWidth = 1;
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
