"use client";

// The historical half of /appearances — 150+ entries spanning 2012–now.
// At that length a plain wall of cards is unreadable, so the category legend
// doubles as a filter and a text box narrows by title/org/location. Both are
// client-side over an already-loaded array: no refetch, no route change.

import { useMemo, useState } from "react";
import { Card } from "@/components/AppearancesSection";
import { PressCard } from "@/components/PressCard";
import Reveal from "@/components/Reveal";
import { categoryForAppearance, type Appearance } from "@/lib/appearances";
import type { PressMention } from "@/lib/press";
import { CATEGORY_ORDER, CATEGORY_STYLE, type CardCategory } from "@/lib/categories";

export type TimelineItem =
  | { kind: "appearance"; ts: number; data: Appearance }
  | { kind: "press"; ts: number; data: PressMention };

function categoryOf(item: TimelineItem): CardCategory {
  return item.kind === "appearance" ? categoryForAppearance(item.data) : item.data.kind;
}

// Every text field a visitor might plausibly type into the box — talk title,
// who it was for, where it happened, the year.
function haystack(item: TimelineItem): string {
  const d = item.data;
  const parts =
    item.kind === "appearance"
      ? [d.title, (d as Appearance).org, (d as Appearance).role, (d as Appearance).location, d.date]
      : [d.title, (d as PressMention).outlet, (d as PressMention).kind, d.date];
  return parts.join(" ").toLowerCase();
}

export default function AppearancesTimeline({ items }: { items: TimelineItem[] }) {
  const [active, setActive] = useState<CardCategory[]>([]);
  const [query, setQuery] = useState("");

  function toggle(c: CardCategory) {
    setActive((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        // No chips selected reads as "show everything", not "show nothing".
        if (active.length > 0 && !active.includes(categoryOf(item))) return false;
        return q === "" || haystack(item).includes(q);
      }),
    [items, active, q]
  );

  const years = useMemo(() => {
    const byYear = new Map<string, TimelineItem[]>();
    for (const item of filtered) {
      const year = String(new Date(item.ts).getUTCFullYear());
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year)!.push(item);
    }
    return [...byYear.entries()]
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, list]) => [year, list.sort((a, b) => b.ts - a.ts)] as const);
  }, [filtered]);

  const isFiltered = active.length > 0 || q !== "";
  // Remounts every card when the filter changes so Reveal's observer re-runs —
  // it disconnects after firing once, so reused nodes would stay invisible.
  const revealKey = `${active.join(",")}|${q}`;

  return (
    <>
      <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((c) => {
            const on = active.includes(c);
            const style = CATEGORY_STYLE[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition ${
                  on ? `${style.border} ${style.text} bg-white/5` : "border-line text-mist hover:border-mist/50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
                {c}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="appearance-search">
            Search appearances
          </label>
          <input
            id="appearance-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SIGGRAPH, Unreal Fest…"
            className="w-full rounded-full border border-line bg-white/5 px-4 py-1.5 font-mono text-xs text-snow placeholder:text-mist/60 focus:border-teal/60 focus:outline-none md:w-56"
          />
          <span className="shrink-0 font-mono text-xs text-mist">
            {filtered.length}
            {isFiltered ? ` / ${items.length}` : ""}
          </span>
        </div>
      </div>

      {years.length === 0 && (
        <p className="mt-16 text-center font-mono text-sm text-mist">
          Nothing matches that.{" "}
          <button
            type="button"
            onClick={() => {
              setActive([]);
              setQuery("");
            }}
            className="text-teal hover:underline"
          >
            Clear filters
          </button>
        </p>
      )}

      {years.map(([year, list]) => (
        <div key={year} className="mt-16">
          <Reveal>
            <h2 className="font-mono text-sm uppercase tracking-widest text-mist">
              <span className="text-teal">▸</span> {year}
            </h2>
          </Reveal>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {list.map((item, i) => (
              <Reveal key={`${item.data.slug}-${revealKey}`} delay={Math.min(i * 40, 280)}>
                {item.kind === "appearance" ? <Card a={item.data} past /> : <PressCard p={item.data} />}
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
