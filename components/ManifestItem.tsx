// A single row of the sample delegation manifest — collapsible, tier-coded.
// Reuses the site's 4-color accent system (teal/sky/amber/grape) as stand-ins
// for the original doc's fleet/gemini/sonnet/opus routing tiers.
export type Tier = "fleet" | "gemini" | "sonnet" | "opus";

const TIER: Record<Tier, { dot: string; text: string; bg: string; border: string; label: string }> = {
  fleet: { dot: "bg-teal", text: "text-teal", bg: "bg-teal/10", border: "border-teal/30", label: "Fleet" },
  gemini: { dot: "bg-sky", text: "text-sky", bg: "bg-sky/10", border: "border-sky/30", label: "Gemini" },
  sonnet: { dot: "bg-amber", text: "text-amber", bg: "bg-amber/10", border: "border-amber/30", label: "Sonnet" },
  opus: { dot: "bg-grape", text: "text-grape", bg: "bg-grape/10", border: "border-grape/30", label: "Opus" },
};

export default function ManifestItem({
  num,
  title,
  tier,
  confidence,
  defaultOpen = false,
  children,
}: {
  num: string;
  title: string;
  tier: Tier;
  confidence: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const t = TIER[tier];
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-line bg-panel/40 open:bg-panel/70"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
        <span className="font-mono text-xs text-mist/60 tabular-nums">{num}</span>
        <span className="font-mono text-teal transition-transform group-open:rotate-90">›</span>
        <span className="flex-1 text-sm font-semibold text-snow">{title}</span>
        <span
          className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] tabular-nums ${t.text} ${t.bg} ${t.border}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
          {t.label} · {confidence}
        </span>
      </summary>
      <div className="space-y-3 px-5 pb-5 pl-11 text-sm leading-relaxed text-mist">{children}</div>
    </details>
  );
}
