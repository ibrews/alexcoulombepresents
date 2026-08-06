import type { Metadata } from "next";
import Ethereal from "@/components/Ethereal";
import IsleBoard from "@/components/IsleBoard";
import IsleDiagram from "@/components/IsleDiagram";
import IsleLayoutExplorer from "@/components/IsleLayoutExplorer";
import IsleRoomExplorer from "@/components/IsleRoomExplorer";
import Reveal from "@/components/Reveal";
import { getIsleEntries } from "@/lib/isle";

export const metadata: Metadata = {
  title: "Isle Advisor Portal",
  robots: { index: false, follow: false },
};

export default function IslePortal() {
  const entries = getIsleEntries();

  return (
    <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/isle</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Isle <span className="grad-text">advisor portal.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mist">
          Shared working notes, decisions, and systems sketches.
        </p>
      </Reveal>

      <IsleBoard />

      <Reveal>
        <IsleRoomExplorer />
      </Reveal>

      <Reveal>
        <IsleLayoutExplorer />
      </Reveal>

      <section className="mt-16" aria-labelledby="isle-log-heading">
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Log</p>
          <h2 id="isle-log-heading" className="mt-2 text-2xl font-bold tracking-tight text-snow">
            Meetings &amp; discussions
          </h2>
        </div>
        <div className="relative space-y-10 border-l border-line pl-7 md:pl-10">
          {entries.map((entry, index) => (
            <Reveal key={entry.slug} delay={index * 80}>
              <article className="glass relative rounded-3xl p-6 md:p-8">
                <span className="absolute -left-[2.1rem] top-8 h-3 w-3 rounded-full border-2 border-ink bg-teal md:-left-[2.85rem]" />
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-amber">{entry.date}</p>
                  <h2 className="text-2xl font-bold tracking-tight text-snow">{entry.title}</h2>
                </div>
                <p className="mt-4 max-w-3xl leading-relaxed text-mist">{entry.summary}</p>

                {entry.notes.length > 0 ? (
                  <ul className="mt-6 space-y-3 text-sm leading-relaxed text-mist">
                    {entry.notes.map((note) => (
                      <li key={note} className="flex gap-3">
                        <span className="text-teal">✦</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {entry.diagram ? <IsleDiagram nodes={entry.diagram.nodes} edges={entry.diagram.edges} /> : null}
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
