"use client";

import { useEffect, useRef, useState } from "react";
import { svgE, buildAvatar } from "./avatar";

// Slide 2 of the HarvardXR 2026 keynote, ported: a Venn diagram of
// Architecture / Theatre / Realtime Tech with pixel-art icons, and a
// 2010-era (beardless) pixel Alex pinballing between his three passions.
// Each arrival triggers the icon's reaction and a pitched pluck.
export default function OriginVenn() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const mutedRef = useRef(true);
  mutedRef.current = muted;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const svg = svgE("svg", { viewBox: "0 0 1600 900", preserveAspectRatio: "xMidYMid meet" });
    host.appendChild(svg);

    const CX = 800, CY = 380, R = 220, S = 2.2;
    const circles = [
      { x: CX - 170, y: CY - 90, label: "Architecture", color: "rgba(167,139,250,.15)", stroke: "rgba(167,139,250,.4)" },
      { x: CX + 170, y: CY - 90, label: "Theatre", color: "rgba(244,63,94,.12)", stroke: "rgba(244,63,94,.4)" },
      { x: CX, y: CY + 110, label: "Realtime Tech", color: "rgba(0,212,255,.12)", stroke: "rgba(0,212,255,.4)" },
    ];
    circles.forEach((c) => {
      svg.appendChild(svgE("circle", { cx: c.x, cy: c.y, r: R, fill: c.color, stroke: c.stroke, "stroke-width": "1.5" }));
      const isBottom = c.y > CY;
      const ly = isBottom ? c.y + R * 0.6 : c.y - R * 0.6;
      const lbl = svgE("text", {
        x: c.x, y: ly, "text-anchor": "middle", fill: "rgba(255,255,255,.7)",
        "font-family": "Space Grotesk,sans-serif", "font-size": "18", "font-weight": "600", "letter-spacing": "2",
      });
      lbl.textContent = c.label.toUpperCase();
      svg.appendChild(lbl);
    });

    // ── Architecture: Greek temple ──
    const archG = svgE("g", { transform: `translate(${CX - 170},${CY - 90})` }) as SVGGElement;
    const ap = (x: number, y: number, w: number, h: number, f: string) =>
      archG.appendChild(svgE("rect", { x: x * S, y: y * S, width: w * S, height: h * S, fill: f }));
    ap(-1, -20, 2, 2, "#c4b5fd"); ap(-3, -18, 6, 2, "#c4b5fd"); ap(-6, -16, 12, 2, "#a78bfa");
    ap(-9, -14, 18, 2, "#a78bfa"); ap(-12, -12, 24, 2, "#9370db"); ap(-13, -10, 26, 2, "#a78bfa");
    ap(-13, -8, 26, 1, "#7c5cbf");
    ap(-11, -7, 3, 18, "#c4b5fd"); ap(-10, -7, 1, 18, "#a78bfa");
    ap(-5, -7, 3, 18, "#c4b5fd"); ap(-4, -7, 1, 18, "#a78bfa");
    ap(2, -7, 3, 18, "#c4b5fd"); ap(3, -7, 1, 18, "#a78bfa");
    ap(8, -7, 3, 18, "#c4b5fd"); ap(9, -7, 1, 18, "#a78bfa");
    ap(-14, 11, 28, 2, "#a78bfa"); ap(-15, 13, 30, 2, "#9370db"); ap(-16, 15, 32, 2, "#7c5cbf");
    archG.style.shapeRendering = "crispEdges";
    svg.appendChild(archG);

    // ── Theatre: proscenium + curtains + spotlight ──
    const theatG = svgE("g", { transform: `translate(${CX + 170},${CY - 90})` }) as SVGGElement;
    const tp = (x: number, y: number, w: number, h: number, f: string) =>
      theatG.appendChild(svgE("rect", { x: x * S, y: y * S, width: w * S, height: h * S, fill: f }));
    tp(-16, -18, 32, 3, "#f59e0b"); tp(-16, -15, 3, 30, "#f59e0b"); tp(13, -15, 3, 30, "#f59e0b");
    tp(-15, -17, 30, 1, "#fde68a"); tp(-13, -15, 26, 27, "#0a0812");
    tp(-13, -15, 4, 25, "#dc2626"); tp(-9, -15, 3, 23, "#ef4444"); tp(-12, -15, 2, 25, "#b91c1c"); tp(-7, -15, 2, 20, "#dc2626");
    tp(9, -15, 4, 25, "#dc2626"); tp(6, -15, 3, 23, "#ef4444"); tp(10, -15, 2, 25, "#b91c1c"); tp(5, -15, 2, 20, "#dc2626");
    tp(-9, -15, 18, 3, "#dc2626"); tp(-7, -13, 14, 2, "#ef4444"); tp(-5, -11, 10, 1, "#dc2626");
    tp(-13, 12, 26, 3, "#8b6f47"); tp(-13, 12, 26, 1, "#a0845c");
    tp(-1, -12, 2, 3, "rgba(255,255,200,.3)"); tp(-2, -9, 4, 4, "rgba(255,255,200,.15)");
    tp(-4, -5, 8, 6, "rgba(255,255,200,.08)"); tp(-6, 1, 12, 6, "rgba(255,255,200,.04)");
    theatG.style.shapeRendering = "crispEdges";
    svg.appendChild(theatG);

    // ── Realtime Tech: monitor with platformer ──
    const techG = svgE("g", { transform: `translate(${CX},${CY + 110})` }) as SVGGElement;
    const xp = (x: number, y: number, w: number, h: number, f: string) =>
      techG.appendChild(svgE("rect", { x: x * S, y: y * S, width: w * S, height: h * S, fill: f }));
    xp(-16, -16, 32, 24, "#1e293b"); xp(-14, -14, 28, 20, "#0f172a"); xp(-14, -14, 28, 1, "#334155");
    xp(-3, 8, 6, 4, "#475569"); xp(-8, 12, 16, 2, "#475569"); xp(-7, 12, 14, 1, "#64748b");
    xp(-12, 2, 24, 2, "#22c55e"); xp(-12, 4, 24, 2, "#166534");
    xp(-6, -4, 2, 2, "#60a5fa"); xp(-7, -2, 4, 4, "#3b82f6"); xp(-7, 2, 2, 1, "#1e40af"); xp(-5, 2, 2, 1, "#1e40af");
    xp(2, -6, 2, 2, "#fbbf24"); xp(7, -8, 2, 2, "#fbbf24");
    xp(4, -2, 8, 2, "#854d0e"); xp(4, -2, 8, 1, "#a16207");
    xp(-10, -12, 6, 2, "rgba(255,255,255,.15)"); xp(5, -10, 4, 2, "rgba(255,255,255,.1)");
    techG.style.shapeRendering = "crispEdges";
    svg.appendChild(techG);

    // Beardless 2010 Alex, orbiting
    const orbitG = svgE("g", { opacity: "0" }) as SVGGElement;
    const avInner = svgE("g", {});
    orbitG.appendChild(avInner);
    buildAvatar(avInner, { withBeard: false });
    svg.appendChild(orbitG);

    // Quote
    const q1 = svgE("text", {
      x: CX, y: 800, "text-anchor": "middle", fill: "rgba(255,255,255,.45)",
      "font-family": "Space Grotesk,sans-serif", "font-size": "22", "font-style": "italic",
    });
    q1.textContent = "“The job I'm going to have in 5 years doesn't exist yet.”";
    svg.appendChild(q1);
    const q2 = svgE("text", {
      x: CX, y: 832, "text-anchor": "middle", fill: "rgba(255,255,255,.25)",
      "font-family": "Space Grotesk,sans-serif", "font-size": "14", "letter-spacing": "2",
    });
    q2.textContent = "— 2010";
    svg.appendChild(q2);

    // ── Reactions ──
    function shakeEl(el: SVGGElement) {
      const origTf = el.getAttribute("transform") || "";
      const offsets = [[3, -2], [-4, 2], [2, 3], [-3, -1], [1, -2], [0, 0]];
      let i = 0;
      const step = () => {
        if (i >= offsets.length) { el.setAttribute("transform", origTf); return; }
        el.setAttribute("transform", origTf + ` translate(${offsets[i][0]},${offsets[i][1]})`);
        i++;
        setTimeout(step, 65);
      };
      step();
    }
    function reactArch() {
      shakeEl(archG);
      const cracks: SVGElement[] = [];
      const addCrack = (x: number, y: number, w: number, h: number) => {
        const c = svgE("rect", { x: x * S, y: y * S, width: w * S, height: h * S, fill: "#2a1a3a", opacity: "0.8" });
        archG.appendChild(c); cracks.push(c);
      };
      addCrack(-10, -2, 1, 6); addCrack(-9, 1, 1, 3); addCrack(-4, -4, 1, 8);
      addCrack(3, -1, 1, 5); addCrack(9, -3, 1, 7);
      setTimeout(() => cracks.forEach((c) => c.remove()), 600);
    }
    function reactTheat() {
      shakeEl(theatG);
      const curtainRects = [...theatG.querySelectorAll("rect")].filter((r) => {
        const f = r.getAttribute("fill") || "";
        return f.includes("dc2626") || f.includes("ef4444") || f.includes("b91c1c");
      }) as (SVGRectElement & { dataset: DOMStringMap })[];
      let frame = 0;
      const shimmer = setInterval(() => {
        frame++;
        curtainRects.forEach((r, i) => {
          if (!r.dataset.origFill) r.dataset.origFill = r.getAttribute("fill") || "";
          r.setAttribute("fill", (frame + i) % 3 === 0 ? "#ff6b6b" : r.dataset.origFill);
        });
        if (frame > 8) {
          clearInterval(shimmer);
          curtainRects.forEach((r) => { if (r.dataset.origFill) r.setAttribute("fill", r.dataset.origFill); });
        }
      }, 70);
    }
    function reactTech() {
      shakeEl(techG);
      const rects = [...techG.querySelectorAll("rect")] as (SVGRectElement & { dataset: DOMStringMap })[];
      const player = rects.filter((r) => ["#3b82f6", "#60a5fa", "#1e40af"].includes((r.getAttribute("fill") || "").toLowerCase()));
      const coins = rects.filter((r) => (r.getAttribute("fill") || "").toLowerCase() === "#fbbf24");
      let frame = 0;
      const run = setInterval(() => {
        frame++;
        const dx = Math.sin(frame * 0.8) * 4 * S;
        player.forEach((r) => {
          if (!r.dataset.origX) r.dataset.origX = r.getAttribute("x") || "0";
          r.setAttribute("x", String(parseFloat(r.dataset.origX) + dx));
        });
        coins.forEach((c, i) => c.setAttribute("opacity", (frame + i) % 3 === 0 ? "0.3" : "1"));
        if (frame > 12) {
          clearInterval(run);
          player.forEach((r) => { if (r.dataset.origX) r.setAttribute("x", r.dataset.origX); });
          coins.forEach((c) => c.setAttribute("opacity", "1"));
        }
      }, 60);
    }

    // Pitched pluck — Am · G · F · E
    let sfxCtx: AudioContext | null = null;
    const VENN_NOTES = [220, 196, 174.6, 164.8];
    function playVennNote(idx: number) {
      if (mutedRef.current) return;
      try {
        if (!sfxCtx) sfxCtx = new AudioContext();
        const ctx = sfxCtx;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        const freq = VENN_NOTES[idx] || 220;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.14, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        o.start(now); o.stop(now + 0.46);
      } catch {}
    }

    // ── Orbit: pinball between icons + center ──
    const waypoints = circles.map((c) => ({ x: c.x, y: c.y }));
    waypoints.push({ x: CX, y: CY });
    const reactions = [reactArch, reactTheat, reactTech, null];
    let wpIdx = 0, orbX = waypoints[0].x, orbY = waypoints[0].y;
    let running = false, raf = 0, dwellTimer = 0, legSpeed = 3;
    const DWELL = 40;

    function pickNext(arrived: number) {
      if (arrived === 3) return Math.floor(Math.random() * 3);
      const others = [0, 1, 2].filter((i) => i !== arrived);
      const roll = Math.random();
      if (roll < 1 / 3) return 3;
      if (roll < 2 / 3) return others[0];
      return others[1];
    }
    function orbStep() {
      if (!running) return;
      if (dwellTimer > 0) { dwellTimer--; raf = requestAnimationFrame(orbStep); return; }
      const target = waypoints[wpIdx];
      const dx = target.x - orbX, dy = target.y - orbY;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        reactions[wpIdx]?.();
        playVennNote(wpIdx);
        wpIdx = pickNext(wpIdx);
        legSpeed = 3 * (0.6 + Math.random() * 0.6);
        dwellTimer = DWELL;
      } else {
        orbX += (dx / dist) * legSpeed;
        orbY += (dy / dist) * legSpeed;
      }
      orbitG.setAttribute("transform", `translate(${orbX},${orbY})`);
      raf = requestAnimationFrame(orbStep);
    }

    // Run only while on screen
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !running) {
            running = true;
            orbitG.setAttribute("opacity", "1");
            raf = requestAnimationFrame(orbStep);
          } else if (!e.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(host);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      obs.disconnect();
      sfxCtx?.close().catch(() => {});
      host.removeChild(svg);
    };
  }, []);

  return (
    <div className="relative">
      <div ref={hostRef} className="w-full [&>svg]:h-auto [&>svg]:w-full" />
      <button
        onClick={() => setMuted(!muted)}
        className="absolute right-3 top-3 rounded-full border border-line px-3 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
        aria-pressed={!muted}
      >
        {muted ? "🔇 sound off" : "🔊 sound on"}
      </button>
    </div>
  );
}
