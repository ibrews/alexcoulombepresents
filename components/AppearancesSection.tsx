import Image from "next/image";
import Reveal from "@/components/Reveal";
import { appearances } from "@/lib/appearances";

export default function AppearancesSection() {
  if (appearances.length === 0) return null;
  return (
    <section id="appearances" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <p className="font-mono text-sm text-teal">what's next</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Find Alex <span className="grad-text">in the wild.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-mist">
          Talks, workshops, judging, mentoring — where to catch him next.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {appearances.map((a, i) => (
          <Reveal key={a.slug} delay={Math.min(i * 70, 280)}>
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass flex h-full gap-4 rounded-2xl p-6 transition hover:border-teal/40"
            >
              {a.image && (
                <Image
                  src={a.image}
                  alt=""
                  width={88}
                  height={88}
                  className="h-22 w-22 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <span className="rounded-full border border-teal/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                  {a.role}
                </span>
                <h3 className="mt-3 font-bold leading-snug text-snow">{a.title}</h3>
                <p className="mt-1 text-sm text-mist">{a.org}</p>
                <p className="mt-2 font-mono text-xs text-mist">
                  {a.date} · {a.location}
                </p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
