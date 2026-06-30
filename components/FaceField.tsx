"use client";

import { useEffect, useRef } from "react";

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

export default function FaceField({ density = 0.00016 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const pointer = { x: -9999, y: -9999 };
    let lastMove = performance.now();
    let particles: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = [];

    const palette = [174, 262, 42];

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor(w * h * density), 320);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        hue: palette[Math.floor(Math.random() * palette.length)],
      }));
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

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      const linkDist = Math.min(w, h) * 0.16;
      const attractors = getAttractors();

      // After 30s idle, ramp in particle-particle repulsion so the field
      // settles into an even distribution with no giant empty patches.
      const idleSec = (performance.now() - lastMove) / 1000;
      const settleFactor = Math.max(0, Math.min(1, (idleSec - 30) / 10));
      const repelR = Math.min(w, h) * 0.22;

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

      raf = requestAnimationFrame(frame);
    }

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
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      frame();
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [density]);

  return (
    <>
      {/* Transparent cutout, bottom-right. His left shoulder aligns to the page
          edge; the full figure shows at natural aspect — no crop, no mask. */}
      <div className="absolute bottom-0 right-0 hidden w-[34%] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/alex-cutout.webp"
          alt="Alex Coulombe"
          className="pointer-events-none block h-auto w-full select-none"
        />
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </>
  );
}
