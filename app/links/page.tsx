import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import { externalLinks } from "@/lib/data";

export const metadata: Metadata = {
  title: "Links",
  description: "Agile Lens, social channels, the podcast — and one website lovingly preserved in 2013 amber.",
  alternates: { canonical: "/links" },
};

export default function Links() {
  const serious = externalLinks.filter((l) => l.vibe !== "joke");
  const joke = externalLinks.find((l) => l.vibe === "joke");

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="ghost" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/links</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
          Everywhere <span className="grad-text">else.</span>
        </h1>
      </Reveal>

      <div className="mt-12 space-y-4">
        {serious.map((l, i) => (
          <Reveal key={l.url} delay={Math.min(i * 60, 240)}>
            <div className="glass group relative rounded-2xl p-6">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-6"
              >
                <div>
                  <h2 className="font-bold group-hover:text-teal">{l.label}</h2>
                  <p className="mt-1 text-sm text-mist">{l.note}</p>
                </div>
                <span className="font-mono text-mist transition-transform group-hover:translate-x-1 group-hover:text-teal">
                  →
                </span>
              </a>
              {l.extra && (
                <a
                  href={l.extra.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-full border border-line px-3.5 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
                >
                  {l.extra.label} ↗
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {joke && (
        <Reveal>
          <div className="relative mt-14 overflow-hidden rounded-2xl border border-dashed border-amber/40 p-6">
            <span className="absolute right-4 top-4 rotate-6 rounded border border-amber/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber">
              vintage
            </span>
            <p className="font-mono text-xs uppercase tracking-widest text-amber">⚠ Historical artifact</p>
            <h2 className="mt-3 font-bold">{joke.label}</h2>
            <p className="mt-1 max-w-xl text-sm text-mist">{joke.note}</p>
            <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs">
              <a
                href={joke.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-4 py-2 text-mist transition-colors hover:border-amber/60 hover:text-snow"
              >
                Visit anyway (brave)
              </a>
              <a
                href={`https://web.archive.org/web/2013/${joke.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-4 py-2 text-mist transition-colors hover:border-amber/60 hover:text-snow"
              >
                Wayback Machine (recommended)
              </a>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="mt-14 text-center">
          <p className="text-mist">Or just say hello:</p>
          <a
            href="mailto:info@alexcoulombepresents.com"
            className="mt-3 inline-block rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            info@alexcoulombepresents.com
          </a>
        </div>
      </Reveal>
    </div>
  );
}
