import type { Metadata } from "next";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/AppearancesSection";
import { PressCard } from "@/components/PressCard";
import { appearances, type Appearance } from "@/lib/appearances";
import { pressMentions } from "@/lib/press";
import { CATEGORY_ORDER, CATEGORY_STYLE } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Appearances — Talks, Panels, Press & Podcasts",
  description:
    "The full history of Alex Coulombe's talks, panels, judging, workshops, guest lectures, press coverage, and podcast appearances — SIGGRAPH, GDC, Unreal Fest, AWE, UploadVR, and dozens more since 2012.",
  alternates: { canonical: "/appearances" },
};

type TimelineItem =
  | { kind: "appearance"; ts: number; data: Appearance }
  | { kind: "press"; ts: number; data: (typeof pressMentions)[number] };

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {CATEGORY_ORDER.map((c) => (
        <span key={c} className="flex items-center gap-2 font-mono text-xs text-mist">
          <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLE[c].dot}`} aria-hidden="true" />
          {c}
        </span>
      ))}
    </div>
  );
}

export default function AppearancesPage() {
  const now = Date.now();
  const upcoming = appearances.filter((a) => new Date(a.endsISO).getTime() >= now);
  const pastAppearances = appearances.filter((a) => new Date(a.endsISO).getTime() < now);

  const timeline: TimelineItem[] = [
    ...pastAppearances.map((a): TimelineItem => ({ kind: "appearance", ts: new Date(a.endsISO).getTime(), data: a })),
    ...pressMentions.map((p): TimelineItem => ({ kind: "press", ts: new Date(p.dateISO).getTime(), data: p })),
  ];

  // Group by year, newest year first; within a year, newest first — talks
  // and press mentions interleaved by date, not split into separate lists.
  const byYear = new Map<string, TimelineItem[]>();
  for (const item of timeline) {
    const year = String(new Date(item.ts).getUTCFullYear());
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(item);
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));
  for (const year of years) {
    byYear.get(year)!.sort((a, b) => b.ts - a.ts);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/appearances</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Presentations, press, <span className="grad-text">&amp; pedagogy.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          {appearances.length + pressMentions.length} talks, workshops, guest lectures, articles, podcasts, and
          more since 2012. This is the full record behind the &quot;Featured in&quot; ticker on the homepage.
          Want to book Alex to speak at your next event?{" "}
          <Link href="/contact" className="text-teal hover:underline">
            Reach out.
          </Link>
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-8">
          <Legend />
        </div>
      </Reveal>

      {upcoming.length > 0 && (
        <div className="mt-16">
          <Reveal>
            <h2 className="font-mono text-sm uppercase tracking-widest text-mist">
              <span className="text-teal">▸</span> What&apos;s next
            </h2>
          </Reveal>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {upcoming.map((a, i) => (
              <Reveal key={a.slug} delay={Math.min(i * 70, 280)}>
                <Card a={a} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {years.map((year) => (
        <div key={year} className="mt-16">
          <Reveal>
            <h2 className="font-mono text-sm uppercase tracking-widest text-mist">
              <span className="text-teal">▸</span> {year}
            </h2>
          </Reveal>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {byYear.get(year)!.map((item, i) => (
              <Reveal
                key={item.kind === "appearance" ? item.data.slug : item.data.slug}
                delay={Math.min(i * 40, 280)}
              >
                {item.kind === "appearance" ? <Card a={item.data} past /> : <PressCard p={item.data} />}
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
