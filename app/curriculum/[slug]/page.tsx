import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Ethereal from "@/components/Ethereal";
import InquireButton from "@/components/InquireButton";
import Reveal from "@/components/Reveal";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import { getCurriculumEntries, getCurriculumEntry } from "@/lib/curriculum";

export function generateStaticParams() {
  return getCurriculumEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const entry = getCurriculumEntry((await params).slug);
  return {
    title: entry ? `${entry.title} · Curriculum` : "Curriculum",
    description: entry?.tagline,
    alternates: { canonical: entry ? `/curriculum/${entry.slug}` : "/curriculum" },
  };
}

export default async function CurriculumEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const entry = getCurriculumEntry((await params).slug);
  if (!entry) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <Link href="/curriculum" className="font-mono text-sm text-teal hover:text-snow">
          ← /curriculum
        </Link>
        <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest text-teal">
          <span>{entry.level}</span>
          <span className="text-mist">·</span>
          <span className="text-mist">{entry.status}</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{entry.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-mist">{entry.tagline}</p>
        <p className="mt-6 font-mono text-sm leading-relaxed text-teal">{entry.format}</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10">
          <SimpleMarkdown markdown={entry.body} />
        </div>
      </Reveal>

      {entry.status === "teasing" && (
        <Reveal delay={120}>
          <div className="glass mt-12 rounded-2xl p-6">
            <p className="text-sm leading-relaxed text-mist">
              This class is being scheduled. Join the list and hear when it runs.
            </p>
            <div className="mt-5">
              <InquireButton
                list="ai"
                label="Tell me when this runs →"
                context={entry.title}
                successMessage="You'll hear when this class is scheduled."
              />
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
