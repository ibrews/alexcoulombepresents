import Image from "next/image";
import Reveal from "@/components/Reveal";
import { appearances, categoryForAppearance, type Appearance } from "@/lib/appearances";
import { CATEGORY_STYLE } from "@/lib/categories";

export function Card({ a, past }: { a: Appearance; past?: boolean }) {
  const style = CATEGORY_STYLE[categoryForAppearance(a)];
  const className = `glass flex h-full gap-4 rounded-2xl p-6 transition hover:border-teal/40 ${
    past ? "opacity-70" : ""
  }`;
  const body = (
    <>
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
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${style.border} ${style.text}`}
        >
          {a.role}
        </span>
        <h3 className="mt-3 font-bold leading-snug text-snow">{a.title}</h3>
        <p className="mt-1 text-sm text-mist">{a.org}</p>
        <p className="mt-2 font-mono text-xs text-mist">
          {a.date} · {a.location}
        </p>
      </div>
    </>
  );

  if (!a.url) {
    return <div className={className}>{body}</div>;
  }

  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}

export default function AppearancesSection() {
  if (appearances.length === 0) return null;

  // Split on each entry's own end time so a finished talk stops claiming to be
  // "what's next" the day after it happens — no manual edit required.
  const now = Date.now();
  const upcoming = appearances.filter((a) => new Date(a.endsISO).getTime() >= now);
  const recent = appearances.filter((a) => new Date(a.endsISO).getTime() < now).slice(-4).reverse();

  return (
    <section id="appearances" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <p className="font-mono text-sm text-teal">
          {upcoming.length > 0 ? "what's next" : "where he's been"}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Find Alex <span className="grad-text">in the wild.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-mist">
          {upcoming.length > 0
            ? "Talks, workshops, judging, mentoring — where to catch him next."
            : "Talks, workshops, judging, mentoring. Nothing on the calendar right now — the next one lands here first."}
        </p>
      </Reveal>

      {upcoming.length > 0 && (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {upcoming.map((a, i) => (
            <Reveal key={a.slug} delay={Math.min(i * 70, 280)}>
              <Card a={a} />
            </Reveal>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <Reveal>
            <p className="mt-14 font-mono text-sm text-mist">recently</p>
          </Reveal>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {recent.map((a, i) => (
              <Reveal key={a.slug} delay={Math.min(i * 70, 280)}>
                <Card a={a} past />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
