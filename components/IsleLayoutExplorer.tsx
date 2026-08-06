"use client";

import { useState } from "react";

type LayoutStage = "popup" | "full";

type ModulePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type VenueModule = {
  id: number;
  popup?: ModulePosition;
  full: ModulePosition;
};

const stages: { id: LayoutStage; label: string }[] = [
  { id: "popup", label: "Popup" },
  { id: "full", label: "Full venue" },
];

const modules: VenueModule[] = [
  {
    id: 1,
    popup: { x: 178, y: 142, width: 118, height: 98 },
    full: { x: 74, y: 78, width: 118, height: 90 },
  },
  {
    id: 2,
    popup: { x: 304, y: 142, width: 118, height: 98 },
    full: { x: 508, y: 78, width: 118, height: 90 },
  },
  {
    id: 3,
    popup: { x: 241, y: 248, width: 118, height: 98 },
    full: { x: 74, y: 280, width: 118, height: 90 },
  },
  { id: 4, full: { x: 508, y: 280, width: 118, height: 90 } },
  { id: 5, full: { x: 260, y: 48, width: 180, height: 66 } },
  { id: 6, full: { x: 260, y: 304, width: 180, height: 66 } },
];

const transition = "fill 480ms ease, fill-opacity 480ms ease, stroke 480ms ease, opacity 480ms ease, transform 480ms ease";
const moduleTransition = "x 560ms ease, y 560ms ease, width 560ms ease, height 560ms ease, opacity 420ms ease, fill 480ms ease, stroke 480ms ease";
const textTransition = "x 560ms ease, y 560ms ease, opacity 420ms ease";

export default function IsleLayoutExplorer() {
  const [stage, setStage] = useState<LayoutStage>("popup");
  const isFull = stage === "full";
  const playerCount = isFull ? "~200 players" : "~15-20 players";

  return (
    <section className="mt-16" aria-labelledby="layout-explorer-heading">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-teal">Same concept, different scale</p>
        <h2 id="layout-explorer-heading" className="mt-2 text-2xl font-bold tracking-tight text-snow">
          How the room count changes at full scale
        </h2>
        <p className="mt-3 text-sm text-mist">
          Illustrative, not a locked floor plan -- a live question about whether the popup is a miniature venue or modules first.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <fieldset>
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber">Venue stage</legend>
          <div className="flex flex-wrap gap-2" aria-label="Venue stage">
            {stages.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={stage === option.id}
                onClick={() => setStage(option.id)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/70 ${
                  stage === option.id
                    ? "border-teal bg-teal/15 text-snow"
                    : "border-line bg-panel/70 text-mist hover:border-teal/50 hover:text-snow"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="font-mono text-xs uppercase tracking-widest text-amber" aria-live="polite">
          Capacity <span className="ml-2 text-snow">{playerCount}</span>
        </p>
      </div>

      <div className="glass mt-6 overflow-x-auto rounded-3xl border border-line p-3 md:p-5">
        <svg
          className="min-w-[42rem]"
          viewBox="0 0 700 420"
          role="img"
          aria-label={`${isFull ? "Full venue" : "Popup"} layout: ${playerCount}`}
        >
          <defs>
            <linearGradient id="common-region-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.42" />
              <stop offset="52%" stopColor="#0ea5a8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0.38" />
            </linearGradient>
          </defs>

          <rect width="700" height="420" rx="22" fill="#0d0e13" />

          <g aria-hidden="true" style={{ opacity: isFull ? 1 : 0, transition }}>
            <path
              d="M185 160 C218 104 278 113 335 137 C397 99 493 123 520 181 C548 240 493 288 425 286 C361 330 252 311 206 264 C175 231 164 193 185 160 Z"
              fill="url(#common-region-gradient)"
              stroke="#8b5cf6"
              strokeOpacity="0.72"
              strokeWidth="1.6"
              strokeDasharray="7 6"
              style={{ transition }}
            />
            <text x="350" y="211" textAnchor="middle" className="fill-snow font-mono text-[11px] uppercase tracking-[0.14em]" style={{ transition }}>
              Open themed region
            </text>
            <text x="350" y="230" textAnchor="middle" className="fill-mist font-mono text-[9px] uppercase tracking-[0.1em]" style={{ transition }}>
              Shared flow &amp; progression
            </text>
          </g>

          <g aria-hidden="true" style={{ opacity: isFull ? 1 : 0, transition }}>
            <path d="M192 123 L219 145 M508 123 L481 145 M192 325 L219 298 M508 325 L481 298 M350 114 L350 137 M350 304 L350 287" stroke="#4fd1c5" strokeOpacity="0.72" strokeWidth="1.5" strokeDasharray="4 4" />
          </g>

          {modules.map((module) => {
            const position = isFull ? module.full : module.popup ?? module.full;
            const isPopupModule = Boolean(module.popup);
            const opacity = isPopupModule || isFull ? 1 : 0;

            return (
              <g key={module.id} aria-hidden={!isPopupModule && !isFull}>
                <rect
                  x={position.x}
                  y={position.y}
                  width={position.width}
                  height={position.height}
                  rx="16"
                  fill={isFull ? "#1a1b21" : "#202127"}
                  fillOpacity={isFull ? 0.95 : 1}
                  stroke={isFull ? "#62f0de" : "#a79f94"}
                  strokeWidth={isFull ? 1.8 : 1.4}
                  style={{ opacity, transition: moduleTransition }}
                />
                <text
                  x={position.x + position.width / 2}
                  y={position.y + position.height / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-snow font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ opacity, transition: textTransition }}
                >
                  Module {module.id}
                </text>
              </g>
            );
          })}

          <g aria-hidden="true" style={{ opacity: isFull ? 1 : 0, transition }}>
            {[
              [286, 178, "S1"],
              [419, 200, "S2"],
              [349, 263, "S3"],
            ].map(([x, y, label]) => (
              <g key={label as string}>
                <circle cx={x as number} cy={y as number} r="13" fill="#101117" stroke="#f6c661" strokeWidth="2.2" />
                <text x={x as number} y={(y as number) + 0.5} textAnchor="middle" dominantBaseline="middle" fill="#f6c661" className="font-mono text-[8px] font-bold">
                  {label as string}
                </text>
              </g>
            ))}
          </g>

          <g aria-hidden="true" style={{ opacity: isFull ? 0 : 1, transition }}>
            <text x="350" y="102" textAnchor="middle" className="fill-mist font-mono text-[10px] uppercase tracking-[0.14em]">
              Self-contained escape-room assembly
            </text>
          </g>
        </svg>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        {isFull
          ? "The shared region and floor-staff coverage appear only at full-venue scale."
          : "Three modules stay tightly grouped; shared space and venue operations remain intentionally absent."}
      </p>
    </section>
  );
}
