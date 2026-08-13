import type { Metadata } from "next";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";
import { Card } from "@/components/AppearancesSection";
import HashScroll from "@/components/HashScroll";
import AppearancesTimeline, { type TimelineItem } from "@/components/AppearancesTimeline";
import { appearances } from "@/lib/appearances";
import { pressMentions } from "@/lib/press";

export const metadata: Metadata = {
  title: "Appearances — Talks, Panels, Press & Podcasts",
  description:
    "The full history of Alex Coulombe's talks, panels, judging, workshops, guest lectures, press coverage, and podcast appearances — SIGGRAPH, GDC, Unreal Fest, AWE, UploadVR, and dozens more since 2012.",
  alternates: { canonical: "/appearances" },
};

export default function AppearancesPage() {
  const now = Date.now();
  const upcoming = appearances.filter((a) => new Date(a.endsISO).getTime() >= now);
  const pastAppearances = appearances.filter((a) => new Date(a.endsISO).getTime() < now);

  const timeline: TimelineItem[] = [
    ...pastAppearances.map((a): TimelineItem => ({ kind: "appearance", ts: new Date(a.endsISO).getTime(), data: a })),
    ...pressMentions.map((p): TimelineItem => ({ kind: "press", ts: new Date(p.dateISO).getTime(), data: p })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      {/* The hero constellation deep-links individual talks as
          /appearances#<slug>. Reveal-animated cards don't reliably scroll
          natively in the App Router — see the note in HashScroll. */}
      <HashScroll />
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

      <AppearancesTimeline items={timeline} />
    </div>
  );
}
