"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToHeroPulse } from "@/lib/heroPulse";
import { dealHeroLinks, type HeroLink, type HeroNodeLink } from "@/lib/heroLinks";
import { LinkNodeLayer, type HeroBounds } from "@/lib/linkNodes";
import LinkNodeAnchors, { type TooltipPlacement } from "@/components/LinkNodeAnchors";

// Calibrated for the transparent head-and-shoulders cutout: the face sits in
// the top ~42% of the frame, centered horizontally around 0.45.
const LANDMARKS = [
  { fx: 0.45, fy: 0.04 }, // crown
  { fx: 0.36, fy: 0.09 }, // left hairline
  { fx: 0.53, fy: 0.09 }, // right hairline
  { fx: 0.30, fy: 0.17 }, // left temple
  { fx: 0.60, fy: 0.17 }, // right temple
  { fx: 0.28, fy: 0.24 }, // left ear
  { fx: 0.62, fy: 0.24 }, // right ear
  { fx: 0.31, fy: 0.31 }, // left cheek
  { fx: 0.59, fy: 0.31 }, // right cheek
  { fx: 0.35, fy: 0.37 }, // left jaw
  { fx: 0.55, fy: 0.37 }, // right jaw
  { fx: 0.45, fy: 0.42 }, // chin
  { fx: 0.38, fy: 0.17 }, // left eyebrow
  { fx: 0.52, fy: 0.17 }, // right eyebrow
  { fx: 0.38, fy: 0.20 }, // left eye
  { fx: 0.51, fy: 0.20 }, // right eye
  { fx: 0.45, fy: 0.14 }, // forehead
  { fx: 0.45, fy: 0.29 }, // nose
  { fx: 0.39, fy: 0.34 }, // left mouth corner
  { fx: 0.51, fy: 0.34 }, // right mouth corner
];

// The constellation is a pointer-era affordance and it needs margins to live
// in. Below Tailwind's `lg` the portrait cutout is hidden and the hero copy
// goes full-bleed — measured at 375x812 the text runs from y96 to the bottom
// with no gap taller than 40px, so every node would have to sit on top of body
// copy as a 56px tap target. Rather than ship that, the layer stands down and
// the hero is exactly what it is today; phones navigate via the hamburger,
// the footer and ⌘K, and nothing here is the only route to any page.
const LINK_MIN_W = 1024;
const LINK_MIN_H = 560;

// Headroom a label needs above its node, and how close to a viewport edge a
// node must be before its label stops being centered on it.
const TOOLTIP_CLEARANCE = 88;
const TOOLTIP_EDGE = 130;
// The hero's furniture moves after first paint — AnnouncementBanner sets
// --banner-h, which slides the fixed header down 40px — so bounds measured
// during mount are stale. Re-check on this cadence and retarget if they moved.
const BOUNDS_POLL_MS = 400;

export default function FaceField({
  density = 0.00016,
  pool = [],
}: {
  density?: number;
  /** Every destination the constellation may draw from — see lib/heroLinkPool.ts. */
  pool?: HeroLink[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const anchorRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const layerRef = useRef<LinkNodeLayer | null>(null);
  const redrawRef = useRef<() => void>(() => {});

  const boundsRef = useRef<HeroBounds>({ navBottom: 0, cutoutTop: 0, cutoutLeft: 0, enabled: false });

  // `active` mirrors the layer's own activeIndex purely so React can render
  // the tooltip; the layer stays the source of truth for the physics.
  const [active, setActive] = useState<number | null>(null);
  const [nodeLinks, setNodeLinks] = useState<HeroNodeLink[]>([]);
  const [coarse, setCoarse] = useState(false);
  // Resolved once per activation from the node's LIVE position. Deriving it
  // from static link data instead was wrong: a right-band node sits high
  // enough that its label overlapped the fixed header on a 1024x800 window.
  const [tip, setTip] = useState<TooltipPlacement>({ below: false, align: "center" });

  const activate = useCallback((index: number | null) => {
    const layer = layerRef.current;
    if (layer && index !== null) {
      const n = layer.nodes[index];
      if (n) {
        const { navBottom } = boundsRef.current;
        setTip({
          // ~88px of headroom: 50px label + 8px gap + 22px half hit-target.
          below: n.y - TOOLTIP_CLEARANCE < navBottom,
          align: n.x > window.innerWidth - TOOLTIP_EDGE ? "right" : n.x < TOOLTIP_EDGE ? "left" : "center",
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
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    setCoarse(isCoarse);

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const pointer = { x: -9999, y: -9999 };
    let lastMove = performance.now();
    let lastTs = performance.now();
    let boundsKey = "";
    let particles: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = [];

    // One draw per visit. Dealt here rather than during render: the homepage
    // is statically prerendered, so a draw at render time would be baked
    // identically into everyone's HTML — or, re-rolled on the client, would
    // mismatch hydration. Mount is the first honest moment to roll dice.
    const layer = new LinkNodeLayer(dealHeroLinks(pool), { reduced });
    layerRef.current = layer;

    const palette = [174, 262, 42];

    function seedParticles(burst = false) {
      const count = Math.min(Math.floor(w * h * density), 320);
      particles = Array.from({ length: count }, () => {
        const angle = randAngle();
        const speed = burst ? Math.random() * 2.3 + 0.8 : 0.35;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: burst ? Math.cos(angle) * speed : (Math.random() - 0.5) * speed,
          vy: burst ? Math.sin(angle) * speed : (Math.random() - 0.5) * speed,
          r: Math.random() * 1.6 + 0.6,
          hue: palette[Math.floor(Math.random() * palette.length)],
        };
      });
    }

    function randAngle() {
      return Math.random() * Math.PI * 2;
    }

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
      boundsKey = "";
      syncBounds();
    }

    // Retarget the constellation whenever the hero's furniture actually moves.
    // Cheap because it early-outs on an unchanged key; two getBoundingClientRect
    // calls a few times a second, never per frame.
    function syncBounds() {
      const bounds = measureBounds();
      const key = `${bounds.navBottom}|${bounds.cutoutTop}|${bounds.cutoutLeft}|${bounds.enabled}`;
      if (key === boundsKey) return false;
      boundsKey = key;
      boundsRef.current = bounds;
      layer.resize(w, h, bounds);
      // Only re-render the anchor list when the visible set actually changes.
      setNodeLinks((prev) => {
        const next = layer.visibleLinks;
        const same =
          prev.length === next.length && prev.every((l, i) => l.href === next[i].href);
        return same ? prev : next;
      });
      return true;
    }

    // Measure, don't assume. The header is fixed at a height that does not
    // scale with the hero, and the cutout only exists at `lg` and up — both
    // were guessed at first, and both guesses put nodes under the nav on a
    // 1024x800 window. See the band note in lib/heroLinks.ts.
    function measureBounds() {
      const cr = canvas!.getBoundingClientRect();
      const header = document.querySelector("header");
      const navBottom = header ? header.getBoundingClientRect().bottom - cr.top : 0;
      const img = imgRef.current;
      // offsetParent is null while the cutout is display:none below `lg`.
      const cutoutVisible = img && img.offsetParent !== null && img.offsetWidth > 0;
      const ir = cutoutVisible ? img.getBoundingClientRect() : null;
      return {
        navBottom: Math.max(0, navBottom),
        cutoutTop: ir ? ir.top - cr.top : h,
        cutoutLeft: ir ? ir.left - cr.left : w,
        enabled: w >= LINK_MIN_W && h >= LINK_MIN_H,
      };
    }

    function getAttractors() {
      const img = imgRef.current;
      if (!img || !canvas) return [];
      const ir = img.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const ox = ir.left - cr.left;
      const oy = ir.top - cr.top;
      return LANDMARKS.map(({ fx, fy }) => ({
        x: ox + fx * ir.width,
        y: oy + fy * ir.height,
      }));
    }

    function frame(now: number) {
      const dt = Math.max(0, (now - lastTs) / 1000);
      lastTs = now;

      ctx!.clearRect(0, 0, w, h);
      const linkDist = Math.min(w, h) * 0.16;
      const attractors = getAttractors();

      // After 30s idle, ramp in particle-particle repulsion so the field
      // settles into an even distribution with no giant empty patches.
      const idleSec = (performance.now() - lastMove) / 1000;
      const settleFactor = Math.max(0, Math.min(1, (idleSec - 30) / 10));
      const repelR = Math.min(w, h) * 0.22;

      // Link-node forces run before integration so this frame's shockwave and
      // clearance bubble land in the same step the dots are advanced.
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

        // face attractor
        for (const att of attractors) {
          const ax = att.x - p.x;
          const ay = att.y - p.y;
          const ad2 = ax * ax + ay * ay;
          const R = 88;
          if (ad2 < R * R && ad2 > 0) {
            const ad = Math.sqrt(ad2);
            const s = (1 - ad / R) * 0.022;
            p.vx += (ax / ad) * s;
            p.vy += (ay / ad) * s;
          }
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
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 70%, 0.75)`;
        ctx!.fill();
      }

      // Settling: mutual repulsion pushes particles apart evenly
      if (settleFactor > 0) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < repelR * repelR && d2 > 0) {
              const d = Math.sqrt(d2);
              const f = (1 - d / repelR) * 0.014 * settleFactor;
              const fx = (dx / d) * f, fy = (dy / d) * f;
              a.vx += fx; a.vy += fy;
              b.vx -= fx; b.vy -= fy;
            }
          }
        }
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
            ctx!.strokeStyle = `hsla(${a.hue}, 70%, 65%, ${(1 - dist / linkDist) * 0.14})`;
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
      lastMove = performance.now();
    }
    function onLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    resize();
    // FaceField and AnnouncementBanner mount in an unspecified order, so the
    // header may still be at its pre-banner offset when resize() first
    // measures. Re-measure once the first frame has settled and place the
    // constellation outright, so nobody watches it drift into position.
    requestAnimationFrame(() => {
      if (syncBounds()) {
        layer.snapToHomes();
        redrawRef.current();
      }
    });
    // A timer rather than a check inside the frame loop, because the frame
    // loop does not exist under reduced motion — and that is exactly the mode
    // where the stale mount-time measurement left the top row of nodes tucked
    // under the header with no later frame to correct them.
    const boundsTimer = window.setInterval(() => {
      if (syncBounds()) redrawRef.current();
    }, BOUNDS_POLL_MS);
    window.addEventListener("resize", resize);
    const unsubscribePulse = reduced
      ? () => undefined
      : subscribeToHeroPulse(() => {
          seedParticles(true);
          lastMove = performance.now();
        });
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      frame(performance.now());
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(boundsTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      unsubscribePulse();
      layerRef.current = null;
      redrawRef.current = () => {};
    };
  }, [density, pool]);

  // With reduced motion there is no RAF loop, and the one-shot frame runs
  // before React has mounted the anchors — leaving every hit-target parked at
  // 0,0 and the whole constellation unreachable. Repaint once they exist.
  useEffect(() => {
    redrawRef.current();
  }, [nodeLinks]);

  // Touch has no hover, so a tap previews and a second tap on the same node
  // commits (see onClick below). Any tap that lands elsewhere clears it.
  useEffect(() => {
    if (!coarse || active === null) return;
    function onDown(e: PointerEvent) {
      const hit = anchorRefs.current.some((el) => el && e.target instanceof Node && el.contains(e.target));
      if (!hit) activate(null);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [coarse, active, activate]);

  return (
    <>
      {/* Transparent cutout, bottom-right. His left shoulder aligns to the page
          edge; the full figure shows at natural aspect — no crop, no mask.
          pointer-events-none: this wrapper's own (rectangular, so including
          the cutout's transparent margins) hit-box would otherwise swallow
          clicks meant for SplatHero's full-bleed backdrop underneath — this
          div has no click handler of its own, and the particle field below
          reads pointer position from window-level listeners, not from this
          element, so disabling hit-testing here has no effect on it. */}
      <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[min(34%,24.5rem)] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/alex-cutout.webp"
          alt="Alex Coulombe"
          className="pointer-events-none block h-auto w-full select-none"
        />
      </div>
      {/* pointer-events-none for the same reason as the cutout above: this
          canvas spans the whole hero, and its own interactivity comes from
          window-level pointermove/pointerleave listeners (see onMove/onLeave
          below), not from events targeted at the canvas element itself. */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      {/* Hit-targets for the link nodes. This layer has to come AFTER
          SplatHero in the hero's DOM order — SplatHero is `pointer-events-auto
          absolute inset-0` (click-to-reshape) and would otherwise swallow
          every one of these. The hero's own headline/CTA block comes later
          still, so real buttons keep winning wherever they overlap. */}
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
