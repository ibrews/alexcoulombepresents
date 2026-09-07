"use client";

import { useState } from "react";

/** An explanatory diagram, not a simulated SceneAudit report or product capture. */
export default function SceneAuditIllustration() {
  const [floating, setFloating] = useState(true);
  const panelY = floating ? 105 : 185;

  return (
    <figure className="mt-10 overflow-hidden rounded-3xl border border-teal/25 bg-ink/80">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">A different view of placement</p>
        <div className="flex gap-2" aria-label="Illustrated panel position">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={floating === value}
              onClick={() => setFloating(value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal ${floating === value ? "border-teal bg-teal text-ink" : "border-line text-mist hover:border-teal/60"}`}
            >
              {value ? "Floating panel" : "Seated panel"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-[1.4fr_1fr]">
        <svg viewBox="0 0 500 280" role="img" aria-label={floating ? "Side-view illustration of a panel 12 centimeters above a reference surface." : "Side-view illustration of a panel seated on its reference surface."} className="w-full">
          <defs>
            <pattern id="scene-audit-grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeOpacity="0.08" />
            </pattern>
          </defs>
          <rect width="500" height="280" fill="url(#scene-audit-grid)" />
          <text x="30" y="35" fill="currentColor" opacity="0.6" fontSize="11" fontFamily="monospace">ORTHOGRAPHIC SIDE VIEW</text>
          <path d="M65 200 H435" stroke="#45e0c4" strokeWidth="2" />
          <path d="M65 207 H435 M65 214 H435" stroke="#45e0c4" strokeOpacity="0.12" />
          <text x="65" y="244" fill="#45e0c4" fontSize="12" fontFamily="monospace">REFERENCE SURFACE</text>
          <rect x="115" y={panelY} width="240" height="15" rx="3" fill={floating ? "#ffca80" : "#45e0c4"} />
          <text x="115" y={panelY - 15} fill="currentColor" opacity="0.8" fontSize="12" fontFamily="monospace">PANEL</text>
          {floating && (
            <g stroke="#ffca80" fill="none">
              <path d="M385 120 V200 M377 120 H393 M377 200 H393" />
              <path d="M355 120 H375" strokeDasharray="3 4" opacity="0.5" />
            </g>
          )}
        </svg>
        <div className="flex flex-col justify-center border-t border-line px-7 py-7 md:border-l md:border-t-0">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">Illustrated normal offset</p>
          <p aria-live="polite" aria-atomic="true" className={`mt-3 font-mono text-5xl tracking-tight ${floating ? "text-amber" : "text-teal"}`}>
            {floating ? "+12" : "0"}<span className="ml-2 text-xl">cm</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            {floating ? "The side view exposes the separation. A signed offset puts a number on it." : "The panel lies against the reference surface. Compare it with the floating example."}
          </p>
        </div>
      </div>
      <figcaption className="border-t border-line px-6 py-4 text-xs leading-relaxed text-mist">
        Interactive illustration of the built-in demo&apos;s two placements. This is a diagram, not a live audit or an editor screenshot.
      </figcaption>
    </figure>
  );
}
