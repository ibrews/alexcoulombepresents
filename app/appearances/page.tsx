import type { Metadata } from "next";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/AppearancesSection";
import { appearances, type Appearance } from "@/lib/appearances";

export const metadata: Metadata = {
  title: "Appearances — Talks, Panels & Judging",
  description:
    "The full history of Alex Coulombe's talks, panels, judging, workshops, and guest lectures — SIGGRAPH, GDC, Unreal Fest, AWE, Autodesk University, and dozens more since 2014.",
  alternates: { canonical: "/appearances" },
};

export default function AppearancesPage() {
  const now = Date.now();
  const upcoming = appearances.filter((a) => new Date(a.endsISO).getTime() >= now);
  const past = appearances.filter((a) => new Date(a.endsISO).getTime() < now);

  // Group past appearances by year, newest year first; within a year, newest first.
  const byYear = new Map<string, Appearance[]>();
  for (const a of past) {
    const year = String(new Date(a.endsISO).getUTCFullYear());
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(a);
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));
  for (const year of years) {
    byYear.get(year)!.sort((a, b) => new Date(b.endsISO).getTime() - new Date(a.endsISO).getTime());
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/appearances</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Every stage, panel, <span className="grad-text">and jury he&apos;s been part of.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          {appearances.length} talks, workshops, judging gigs, and guest lectures since 2014 — SIGGRAPH,
          GDC, Unreal Fest, AWE, Autodesk University, and dozens more. This is the full record behind the
          &quot;Featured in&quot; ticker on the homepage.
        </p>
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
            {byYear.get(year)!.map((a, i) => (
              <Reveal key={a.slug} delay={Math.min(i * 40, 280)}>
                <Card a={a} past />
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
