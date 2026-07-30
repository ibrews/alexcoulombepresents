import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import { getCurriculumEntries } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "Live, hands-on AI classes taught by Alex Coulombe.",
  alternates: { canonical: "/curriculum" },
};

export default function Curriculum() {
  const entries = getCurriculumEntries();

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/curriculum</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          AI classes for work you <span className="grad-text">actually want to do.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Live, hands-on sessions for building a practical AI setup and shipping the things you
          have been meaning to make.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {entries.map((entry, index) => (
          <Reveal key={entry.slug} delay={Math.min(index * 80, 240)}>
            <Link
              href={`/curriculum/${entry.slug}`}
              className="glass block h-full rounded-2xl p-6 transition hover:border-teal/40"
            >
              <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-teal">
                <span>{entry.level}</span>
                <span className="text-mist">·</span>
                <span className="text-mist">{entry.status}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-snow">{entry.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">{entry.tagline}</p>
              <p className="mt-5 font-mono text-xs leading-relaxed text-mist">{entry.format}</p>
              <p className="mt-5 text-sm font-semibold text-teal">View class →</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
