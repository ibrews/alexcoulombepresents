"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dealHeroLinks, type HeroLink, type HeroNodeLink } from "@/lib/heroLinks";
import { labSlots, LAB_TIER_QUOTA, LAB_LINK_MIN_W, LAB_LINK_MIN_H } from "@/lib/labLinks";
import { LinkNodeLayer, type HeroBounds } from "@/lib/linkNodes";
import LinkNodeAnchors, { type TooltipPlacement } from "@/components/LinkNodeAnchors";

// Interactive constellation particle field. Particles drift, link when close,
// and are gently repelled by the pointer — a nod to spatial hand interaction.
//
// Given a `pool`, it also grows the same navigable link nodes the homepage
// hero has (lib/linkNodes.ts), placed against /lab's own measured layout —
// see lib/labLinks.ts for why the slots are its own and not heroSlots.

// Headroom a label needs above its node, and how close to a viewport edge a
// node must be before its label stops being centered on it.
const TOOLTIP_CLEARANCE = 88;
const TOOLTIP_EDGE = 130;
// The page's furniture moves after first paint — AnnouncementBanner sets
// --banner-h, which slides the fixed header down 40px and the whole field with
// it — so bounds measured during mount are stale. A TIMER, not a check inside
// the frame loop: under prefers-reduced-motion there is no frame loop, and
// that is exactly the mode where the homepage's stale mount-time measurement
// once left its top row of nodes parked under the header with no later frame
// to correct them.
const BOUNDS_POLL_MS = 400;

/** Selectors for the copy a node must not land on, in priority order. */
const OBSTACLES = "h1, p";

export default function ParticleField({
  density = 0.00008,
  dim = 1,
  pool = [],
}: {
  density?: number;
  /**
   * Ambient-dot opacity, 0–1. Applied per-dot in code rather than as CSS
   * opacity on a wrapper, because the link nodes draw onto the SAME canvas and
   * must not be dimmed with them — a half-strength link dot on a busy page is
   * a discoverability regression, and discoverability is already this
   * feature's weak point.
   */
  dim?: number;
  /** Destinations the constellation may draw from — see lib/labLinkPool.ts. */
  pool?: HeroLink[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const layerRef = useRef<LinkNodeLayer | null>(null);
  const redrawRef = useRef<() => void>(() => {});
  const boundsRef = useRef<HeroBounds>({ navBottom: 0, cutoutTop: 0, cutoutLeft: 0, enabled: false });

  // `active` mirrors the layer's own activeIndex purely so React can render
  // the tooltip; the layer stays the source of truth for the physics.
  const [active, setActive] = useState<number | null>(null);
  const [nodeLinks, setNodeLinks] = useState<HeroNodeLink[]>([]);
  const [coarse, setCoarse] = useState(false);
  const [tip, setTip] = useState<TooltipPlacement>({ below: false, align: "center" });

  const activate = useCallback((index: number | null) => {
    const layer = layerRef.current;
    if (layer && index !== null) {
      const n = layer.nodes[index];
      const canvas = canvasRef.current;
      if (n && canvas) {
        // Resolved from the node's LIVE position in VIEWPORT space, not from
        // static slot data and not in canvas space: this band starts 128px
        // down the page, so a node near its top still has ample room for a
        // label above it. Comparing canvas-local y against a canvas-local
        // navBottom of 0 would flip every top node's label downward onto the
        // headline for no reason.
        const cr = canvas.getBoundingClientRect();
        const header = document.querySelector("header");
        const navBottom = header ? header.getBoundingClientRect().bottom : 0;
        setTip({
          below: cr.top + n.y - TOOLTIP_CLEARANCE < navBottom,
          align:
            cr.left + n.x > window.innerWidth - TOOLTIP_EDGE
              ? "right"
              : cr.left + n.x < TOOLTIP_EDGE
                ? "left"
                : "center",
        });
      }
    }
    layer?.setActive(index);
    setActive(index);
    redrawRef.current();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCoarse(window.matchMedia("(pointer: coarse)").matches);

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    let lastTs = performance.now();
    let boundsKey = "";
    const pointer = { x: -9999, y: -9999 };
    let particles: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = [];

    const palette = [174, 262, 42]; // teal, purple, amber hues

    // One draw per visit, at mount rather than during render: /lab is
    // statically prerendered, so a draw at render time would be baked
    // identically into everyone's HTML — or, re-rolled on the client, would
    // mismatch hydration.
    const layer = new LinkNodeLayer(dealHeroLinks(pool, Math.random, labSlots, LAB_TIER_QUOTA), {
      reduced,
    });
    layerRef.current = layer;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor(w * h * density), 160);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        hue: palette[Math.floor(Math.random() * palette.length)],
      }));
      boundsKey = "";
      syncBounds();
      // Place the constellation outright rather than letting it glide.
      //
      // FaceField deliberately does NOT snap on a later resize, and it is
      // right to: the only thing that moves its bands after mount is the
      // announcement banner nudging the header ~40px, and watching that ease
      // is better than watching it jump. Here the bands are anchored to the
      // VIEWPORT edges, so dragging a window from 1440 to 1024 moves the right
      // strand 416px at once — and the home spring is overdamped enough
      // (HOME_K 2.2 / damp 2.4) that measured, it crawls back at roughly 20px
      // a second. Every node spends several seconds off-screen and
      // unclickable. A resize is a re-layout, not a nudge.
      layer.snapToHomes();
    }

    /**
     * Measure, don't assume. The header is fixed and does not scale with this
     * band, and the width of the free margins either side of the copy depends
     * on where `max-w-6xl` lands — at 1440 the left margin is 164px and at
     * 1024 it is the section's 20px padding, which is no margin at all.
     */
    function measureBounds(): HeroBounds {
      const cr = canvas!.getBoundingClientRect();
      const header = document.querySelector("header");
      const navBottom = header ? header.getBoundingClientRect().bottom - cr.top : 0;

      // The obstacle is the page's opening copy. Two rects per element: the
      // block box for an h1 (its `max-w-*` measure is filled line to line, so
      // the box IS the obstacle) and the union of line boxes for a paragraph
      // (several here are full-bleed blocks holding one short line, and
      // treating those boxes as solid would swallow the entire right margin).
      let left = Infinity;
      let right = -Infinity;
      const section = canvas!.closest("section");
      for (const el of section ? Array.from(section.querySelectorAll(OBSTACLES)) : []) {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        let { left: l, right: r } = box;
        if (el.tagName !== "H1") {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          if (text.width > 0) {
            l = text.left;
            r = text.right;
          }
        }
        left = Math.min(left, l - cr.left);
        right = Math.max(right, r - cr.left);
      }

      return {
        navBottom: Math.max(0, navBottom),
        // No portrait cutout on this page: the side band gets the full height
        // and the floor band the full width. (No slot uses either today.)
        cutoutTop: h,
        cutoutLeft: w,
        gutterLeft: Number.isFinite(left) ? Math.max(0, left) : w,
        gutterRight: Number.isFinite(right) ? Math.max(0, w - right) : w,
        enabled: pool.length > 0 && w >= LAB_LINK_MIN_W && h >= LAB_LINK_MIN_H,
      };
    }

    // Retarget whenever the measurement actually changes. Cheap because it
    // early-outs on an unchanged key.
    function syncBounds() {
      const bounds = measureBounds();
      const key = `${bounds.navBottom}|${bounds.gutterLeft}|${bounds.gutterRight}|${bounds.enabled}`;
      if (key === boundsKey) return false;
      boundsKey = key;
      boundsRef.current = bounds;
      layer.resize(w, h, bounds);
      // Only re-render the anchor list when the visible set actually changes —
      // it does change here, because a band whose gutter has closed loses its
      // nodes outright.
      setNodeLinks((prev) => {
        const next = layer.visibleLinks;
        const same = prev.length === next.length && prev.every((l, i) => l.href === next[i].href);
        return same ? prev : next;
      });
      return true;
    }

    function frame(now: number) {
      const dt = Math.max(0, (now - lastTs) / 1000);
      lastTs = now;

      ctx!.clearRect(0, 0, w, h);
      const linkDist = Math.min(w, h) * 0.16;

      // Link-node forces run before integration so this frame's ripple and
      // bulge land in the same step the dots are advanced.
      layer.update(dt, particles, pointer);

      for (const p of particles) {
        // pointer repulsion
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16000) {
          const d = Math.sqrt(d2) || 1;
          p.vx += (dx / d) * 0.18;
          p.vy += (dy / d) * 0.18;
        }
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.75 * dim})`;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `hsla(${a.hue}, 70%, 65%, ${(1 - dist / linkDist) * 0.14 * dim})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }

      layer.draw(ctx!);

      // Drive the hit-targets straight from the layer. Mutating transforms
      // here instead of through React state keeps this off the render path.
      for (let i = 0; i < layer.nodes.length; i++) {
        const el = anchorRefs.current[i];
        if (!el) continue;
        const n = layer.nodes[i];
        el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) translate(-50%, -50%)`;
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    // In reduced-motion mode the loop is not running, so activation needs an
    // explicit one-shot repaint to show the highlight.
    redrawRef.current = () => {
      if (reduced) frame(performance.now());
    };

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    resize();
    // ParticleField and AnnouncementBanner mount in an unspecified order, so
    // the header may still be at its pre-banner offset when resize() first
    // measures. Re-measure once the first frame has settled and place the
    // constellation outright, so nobody watches it glide into position.
    requestAnimationFrame(() => {
      if (syncBounds()) {
        layer.snapToHomes();
        redrawRef.current();
      }
    });
    const boundsTimer = window.setInterval(() => {
      if (syncBounds()) redrawRef.current();
    }, BOUNDS_POLL_MS);
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      frame(performance.now()); // draw a single static frame
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(boundsTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      layerRef.current = null;
      redrawRef.current = () => {};
    };
  }, [density, dim, pool]);

  // With reduced motion there is no RAF loop, and the one-shot frame runs
  // before React has mounted the anchors — leaving every hit-target parked at
  // 0,0 and the whole constellation unreachable. Repaint once they exist.
  useEffect(() => {
    // Unlike the hero's, this set changes SIZE — widening past 1024 opens the
    // left margin and adds four nodes, narrowing closes it and removes them.
    // Trim the ref array to match, or the removed anchors stay reachable here
    // as detached elements long after React has unmounted them.
    anchorRefs.current.length = nodeLinks.length;
    redrawRef.current();
  }, [nodeLinks]);

  // Touch has no hover, so a tap previews and a second tap on the same node
  // commits (see LinkNodeAnchors). Any tap that lands elsewhere clears it.
  useEffect(() => {
    if (!coarse || active === null) return;
    function onDown(e: PointerEvent) {
      const hit = anchorRefs.current.some(
        (el) => el && e.target instanceof Node && el.contains(e.target)
      );
      if (!hit) activate(null);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [coarse, active, activate]);

  return (
    <>
      {/* pointer-events-none: this canvas spans the whole band, and its own
          interactivity comes from window-level pointermove/pointerleave
          listeners, not from events targeted at the canvas element itself. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      <LinkNodeAnchors
        links={nodeLinks}
        active={active}
        coarse={coarse}
        tip={tip}
        anchorRefs={anchorRefs}
        onActivate={activate}
      />
    </>
  );
}
