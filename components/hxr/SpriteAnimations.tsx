"use client";
import { useEffect, useRef, useState } from "react";
import { buildAvatar, spawnParticles } from "./avatar";

const ACCENT_HEX: Record<string, string> = {
  amber: "#fbbf24",
  teal: "#2dd4bf",
  grape: "#a78bfa",
};
const DIM = "rgba(255,255,255,0.12)";
const MIST = "#9b9bb5";

function useSprite(withBeard = false) {
  const svgRef = useRef<SVGSVGElement>(null);
  const avatarRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || avatarRef.current) return;
    avatarRef.current = buildAvatar(svg as unknown as SVGElement, { withBeard });
  }, [withBeard]);
  return { svgRef, avatarRef };
}

function celebrate(
  svgRef: React.RefObject<SVGSVGElement | null>,
  avatarRef: React.RefObject<SVGElement | null>
) {
  avatarRef.current?.classList.add("arm-up");
  const rect = svgRef.current?.getBoundingClientRect();
  if (rect) {
    spawnParticles(rect.left + rect.width * 0.1, rect.top + rect.height * 0.35);
    spawnParticles(rect.left + rect.width * 0.9, rect.top + rect.height * 0.35);
  }
  setTimeout(() => avatarRef.current?.classList.remove("arm-up"), 900);
}

function Stepper({
  step,
  total,
  onStep,
  fireLabel = "fire next →",
}: {
  step: number;
  total: number;
  onStep: (n: number) => void;
  fireLabel?: string;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      <button
        onClick={() => onStep(Math.max(0, step - 1))}
        disabled={step <= 0}
        className="font-mono text-xs text-mist transition-colors hover:text-snow disabled:opacity-20"
        aria-label="Fewer"
      >
        ← fewer
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 w-1 rounded-full transition-colors ${i < step ? "bg-teal" : "bg-line"}`}
          />
        ))}
      </div>
      <button
        onClick={() => onStep(Math.min(total, step + 1))}
        disabled={step >= total}
        className="font-mono text-xs text-teal transition-colors hover:text-snow disabled:opacity-20"
        aria-label="More"
      >
        {fireLabel}
      </button>
    </div>
  );
}

/* ── Panel 1: Agile Lens — client names orbit the sprite ── */
const CLIENTS = [
  "Disney",
  "Epic Games",
  "Google",
  "Kennedy Center",
  "Four Seasons",
  "Lincoln Center",
  "Royal Caribbean",
  "Samsung",
];

export function AgileLensOrbit() {
  const { svgRef, avatarRef } = useSprite();
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (count === CLIENTS.length) celebrate(svgRef, avatarRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[260px] md:max-w-[300px]">
        <div className="absolute inset-[17%] rounded-full border border-teal/25" />
        <svg
          ref={svgRef}
          viewBox="-18 -43 36 71"
          className="absolute left-1/2 top-1/2 w-16 -translate-x-1/2 -translate-y-1/2 md:w-20"
          aria-hidden
        />
        {CLIENTS.map((c, i) => {
          const angle = (360 / CLIENTS.length) * i - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 41;
          const y = 50 + Math.sin(rad) * 41;
          const visible = i < count;
          return (
            <span
              key={c}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transitionDelay: visible ? `${i * 60}ms` : "0ms",
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-teal/30 bg-panel/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mist transition-all duration-500 ease-out ${
                visible ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            >
              {c}
            </span>
          );
        })}
      </div>
      <Stepper step={count} total={CLIENTS.length} onStep={setCount} fireLabel="next client →" />
    </div>
  );
}

/* ── Panel 2: Tool Journey — sprite fires tool projectiles, 2016 → 2023 → 2026 ── */
type Wave = { year: string; accent: "amber" | "teal" | "grape"; items: string[] };
const WAVES: Wave[] = [
  { year: "2016", accent: "amber", items: ["Revit", "3ds Max", "Rhino", "SketchUp", "Unity", "Unreal"] },
  { year: "2023", accent: "teal", items: ["Unreal"] },
  { year: "2026", accent: "grape", items: ["Claude", "Blender", "Godot", "RealityKit", "Unreal"] },
];

type Shot = { era: number; year: string; accent: string; label: string; angle: number; radius: number };

function buildShots(): Shot[] {
  const shots: Shot[] = [];
  WAVES.forEach((w, ei) => {
    const n = w.items.length;
    const baseRadius = 40 + ei * 22;
    w.items.forEach((label, i) => {
      const angle = n === 1 ? 90 : 10 + i * (160 / (n - 1));
      const radius = n === 1 ? baseRadius : baseRadius + (i % 2 === 0 ? 0 : 20);
      shots.push({ era: ei, year: w.year, accent: w.accent, label, angle, radius });
    });
  });
  return shots;
}
const SHOTS = buildShots();

export function ToolJourneyBurst() {
  const { svgRef, avatarRef } = useSprite(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (step === SHOTS.length) celebrate(svgRef, avatarRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const currentEra = step > 0 ? SHOTS[Math.min(step, SHOTS.length) - 1].era : 0;
  const currentYear = step > 0 ? SHOTS[Math.min(step, SHOTS.length) - 1].year : WAVES[0].year;

  return (
    <div>
      <div className="relative mx-auto h-72 w-full md:h-80">
        <span className="absolute left-1/2 top-2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-mist transition-colors">
          {currentYear}
        </span>
        <svg
          ref={svgRef}
          viewBox="-22 -46 44 76"
          className="absolute bottom-2 left-1/2 w-20 -translate-x-1/2 md:w-24"
          aria-hidden
        />
        {SHOTS.map((s, i) => {
          const fired = i < step;
          const bright = fired && s.era === currentEra;
          const rad = (s.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * s.radius;
          const ty = -Math.sin(rad) * s.radius;
          const hex = ACCENT_HEX[s.accent];
          return (
            <span
              key={s.label + i}
              style={{
                left: "50%",
                bottom: 88,
                borderColor: bright ? hex : DIM,
                color: bright ? hex : MIST,
                transform: fired
                  ? `translate(calc(-50% + ${tx}px), ${ty}px) scale(${bright ? 1 : 0.8})`
                  : "translate(-50%, 0) scale(0)",
              }}
              className={`absolute whitespace-nowrap rounded-full border bg-panel/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-all duration-500 ease-out ${
                fired ? (bright ? "opacity-100" : "opacity-35") : "opacity-0"
              }`}
            >
              {s.label}
            </span>
          );
        })}
      </div>
      <Stepper step={step} total={SHOTS.length} onStep={setStep} />
    </div>
  );
}
