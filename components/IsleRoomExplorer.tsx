"use client";

import { useId, useState } from "react";

type RealityMode = "vr" | "mr" | "skin";
type PresenceMode = "colocated" | "remote";
type MarkerRole = "player" | "actor" | "staff";

type Marker = {
  id: string;
  label: string;
  role: MarkerRole;
  colocated: { x: number; y: number };
  remote: { x: number; y: number };
};

const realityModes: { id: RealityMode; label: string }[] = [
  { id: "vr", label: "Virtual Reality" },
  { id: "mr", label: "Mixed Reality" },
  { id: "skin", label: "Spatial Skinning" },
];

const presenceModes: { id: PresenceMode; label: string }[] = [
  { id: "colocated", label: "Co-located" },
  { id: "remote", label: "Remote" },
];

const roleStyles: Record<MarkerRole, { color: string; label: string; description: string }> = {
  player: {
    color: "#4fd1c5",
    label: "Player",
    description: "A paying guest moving through the space.",
  },
  actor: {
    color: "#c4a7ff",
    label: "Actor/NPC",
    description: "Staff in character, physically present, drives story beats.",
  },
  staff: {
    color: "#f6c661",
    label: "Floor staff",
    description: "Safety/show-control, not part of the fiction.",
  },
};

const markers: Marker[] = [
  { id: "p1", label: "P1", role: "player", colocated: { x: 260, y: 175 }, remote: { x: 63, y: 142 } },
  { id: "p2", label: "P2", role: "player", colocated: { x: 338, y: 232 }, remote: { x: 105, y: 142 } },
  { id: "p3", label: "P3", role: "player", colocated: { x: 444, y: 169 }, remote: { x: 63, y: 278 } },
  { id: "actor", label: "A", role: "actor", colocated: { x: 458, y: 238 }, remote: { x: 105, y: 278 } },
  { id: "s1", label: "S1", role: "staff", colocated: { x: 234, y: 296 }, remote: { x: 234, y: 296 } },
  { id: "s2", label: "S2", role: "staff", colocated: { x: 475, y: 296 }, remote: { x: 475, y: 296 } },
];

const transition = "fill 480ms ease, fill-opacity 480ms ease, stroke 480ms ease, opacity 480ms ease, transform 480ms ease";
const markerTransition = "cx 560ms ease, cy 560ms ease, fill 480ms ease, stroke 480ms ease, opacity 480ms ease";

export default function IsleRoomExplorer() {
  const [reality, setReality] = useState<RealityMode>("vr");
  const [presence, setPresence] = useState<PresenceMode>("colocated");
  const gradientId = useId().replace(/:/g, "");
  const skinGradientId = useId().replace(/:/g, "");
  const isVR = reality === "vr";
  const isMR = reality === "mr";
  const isRemote = presence === "remote";
  const roomStroke = isVR ? "#62f0de" : "#a79f94";
  const roomFill = isVR ? `url(#${gradientId})` : "#1a1b21";
  const zoneFill = isVR ? `url(#${gradientId})` : reality === "skin" ? `url(#${skinGradientId})` : "#202127";
  const zoneStroke = isVR ? "#bba4ff" : "#8d877f";

  return (
    <section className="mt-16" aria-labelledby="room-explorer-heading">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-teal">Room &amp; roles explorer</p>
        <h2 id="room-explorer-heading" className="mt-2 text-2xl font-bold tracking-tight text-snow">
          See one room shift across formats
        </h2>
        <p className="mt-3 text-sm text-mist">Illustrative example, not a locked design -- toggle to compare formats.</p>
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <fieldset>
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber">Reality mode</legend>
          <div className="flex flex-wrap gap-2" aria-label="Reality mode">
            {realityModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={reality === mode.id}
                onClick={() => setReality(mode.id)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/70 ${
                  reality === mode.id
                    ? "border-teal bg-teal/15 text-snow"
                    : "border-line bg-panel/70 text-mist hover:border-teal/50 hover:text-snow"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber">Presence</legend>
          <div className="flex flex-wrap gap-2" aria-label="Presence mode">
            {presenceModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={presence === mode.id}
                onClick={() => setPresence(mode.id)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal/70 ${
                  presence === mode.id
                    ? "border-amber bg-amber/15 text-snow"
                    : "border-line bg-panel/70 text-mist hover:border-amber/50 hover:text-snow"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="glass mt-6 overflow-x-auto rounded-3xl border border-line p-3 md:p-5">
        <svg className="min-w-[42rem]" viewBox="0 0 700 420" role="img" aria-label={`${realityModes.find((mode) => mode.id === reality)?.label} room with ${presence} participants`}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.62" />
              <stop offset="55%" stopColor="#0ea5a8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4fd1c5" stopOpacity="0.48" />
            </linearGradient>
            <linearGradient id={skinGradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.52" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f6c661" stopOpacity="0.38" />
            </linearGradient>
            <filter id="room-glow" x="-20%" y="-30%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect width="700" height="420" rx="22" fill="#0d0e13" />

          <g aria-hidden="true" style={{ opacity: isVR ? 1 : 0, transition }}>
            {[
              [184, 89], [226, 119], [300, 89], [384, 101], [508, 130], [572, 88], [615, 206], [186, 347], [532, 341], [458, 55],
            ].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 2.4 : 1.3} fill={index % 2 === 0 ? "#c4a7ff" : "#4fd1c5"} />
            ))}
          </g>

          <g aria-hidden="true" style={{ opacity: isRemote ? 1 : 0, transition }}>
            <path d="M137 143 H150" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M137 278 H150" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 4" />
            <rect x="20" y="96" width="117" height="94" rx="14" fill="#171820" stroke="#5d616d" strokeWidth="1.2" />
            <rect x="20" y="231" width="117" height="94" rx="14" fill="#171820" stroke="#5d616d" strokeWidth="1.2" />
            <text x="78.5" y="116" textAnchor="middle" className="fill-mist font-mono text-[9px] uppercase tracking-[0.08em]">Remote location A</text>
            <text x="78.5" y="251" textAnchor="middle" className="fill-mist font-mono text-[9px] uppercase tracking-[0.08em]">Remote location B</text>
          </g>

          <g filter={isVR ? "url(#room-glow)" : undefined} style={{ transition }}>
            <rect
              x="150"
              y="62"
              width="400"
              height="290"
              rx="26"
              fill={roomFill}
              stroke={roomStroke}
              strokeWidth={isVR ? 2.4 : 1.6}
              strokeDasharray={isVR ? "10 7" : undefined}
              style={{ transition }}
            />
            <rect
              x="189"
              y="125"
              width="148"
              height="130"
              rx="18"
              fill={zoneFill}
              fillOpacity={isMR ? 0.12 : 1}
              stroke={zoneStroke}
              strokeWidth={isVR ? 1.8 : 1.2}
              strokeDasharray={isVR ? "7 5" : undefined}
              style={{ transition }}
            />
            <rect
              x="363"
              y="125"
              width="148"
              height="130"
              rx="18"
              fill={zoneFill}
              fillOpacity={isMR ? 0.12 : 1}
              stroke={zoneStroke}
              strokeWidth={isVR ? 1.8 : 1.2}
              strokeDasharray={isVR ? "7 5" : undefined}
              style={{ transition }}
            />
          </g>

          <text x="170" y="92" className="fill-snow font-mono text-[10px] uppercase tracking-[0.16em]">Shared room</text>
          <text x="263" y="151" textAnchor="middle" className="fill-mist font-mono text-[10px] uppercase tracking-[0.12em]">Zone A</text>
          <text x="437" y="151" textAnchor="middle" className="fill-mist font-mono text-[10px] uppercase tracking-[0.12em]">Zone B</text>

          <g aria-hidden="true" style={{ opacity: isMR ? 1 : 0, transition }}>
            {[[292, 191], [414, 210], [474, 173]].map(([x, y], index) => (
              <path key={index} d={`M${x} ${y - 8} L${x + 4} ${y - 4} L${x + 8} ${y} L${x + 4} ${y + 4} L${x} ${y + 8} L${x - 4} ${y + 4} L${x - 8} ${y} L${x - 4} ${y - 4} Z`} fill={index === 1 ? "#c4a7ff" : "#4fd1c5"} />
            ))}
          </g>

          <g aria-hidden="true" style={{ opacity: reality === "skin" ? 0.65 : 0, transition }}>
            <path d="M205 230 C240 198, 283 272, 322 213" fill="none" stroke="#c4a7ff" strokeWidth="2" strokeLinecap="round" />
            <path d="M380 224 C421 177, 465 269, 497 198" fill="none" stroke="#4fd1c5" strokeWidth="2" strokeLinecap="round" />
          </g>

          {markers.map((marker) => {
            const position = isRemote ? marker.remote : marker.colocated;
            const style = roleStyles[marker.role];
            return (
              <g key={marker.id} style={{ transition: "transform 560ms ease" }}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="15"
                  fill="#101117"
                  stroke={style.color}
                  strokeWidth="2.4"
                  style={{ transition: markerTransition }}
                />
                <text
                  x={position.x}
                  y={position.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={style.color}
                  className="pointer-events-none font-mono text-[9px] font-bold"
                  style={{ transition: markerTransition }}
                >
                  {marker.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Role legend">
        {(Object.keys(roleStyles) as MarkerRole[]).map((role) => {
          const style = roleStyles[role];
          return (
            <div key={role} className="flex gap-3 rounded-2xl border border-line bg-panel/40 p-4">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: style.color }} aria-hidden="true" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-snow">{style.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-mist">{style.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
