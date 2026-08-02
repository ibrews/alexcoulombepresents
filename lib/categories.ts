// ── Shared category taxonomy for /appearances ───────────────────────────
//
// One dimension covers both halves of the page: how Alex showed up (in
// person / virtual) for a speaking engagement, or how a piece of coverage
// relates to him (press / podcast / his work featured without him
// personally attending or being named — e.g. a rendering of his used in an
// article that never mentions him).

export type CardCategory = "In Person" | "Virtual" | "Press" | "Podcast" | "Work Featured";

export const CATEGORY_ORDER: CardCategory[] = [
  "In Person",
  "Virtual",
  "Press",
  "Podcast",
  "Work Featured",
];

export const CATEGORY_STYLE: Record<CardCategory, { dot: string; text: string; border: string }> = {
  "In Person": { dot: "bg-teal", text: "text-teal", border: "border-teal/60" },
  Virtual: { dot: "bg-sky", text: "text-sky", border: "border-sky/60" },
  Press: { dot: "bg-amber", text: "text-amber", border: "border-amber/60" },
  Podcast: { dot: "bg-grape", text: "text-grape", border: "border-grape/60" },
  "Work Featured": { dot: "bg-mist", text: "text-mist", border: "border-mist/40" },
};
