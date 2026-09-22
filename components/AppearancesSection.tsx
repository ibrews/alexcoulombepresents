import Image from "next/image";
import Reveal from "@/components/Reveal";
import { appearances, partitionAppearances, categoryForAppearance, type Appearance } from "@/lib/appearances";
import { CATEGORY_STYLE } from "@/lib/categories";
import { LinkTypeIcon, linkKindForUrl } from "@/components/LinkTypeIcon";

export function Card({ a, past }: { a: Appearance; past?: boolean }) {
  const style = CATEGORY_STYLE[categoryForAppearance(a)];
  const className = `group glass relative flex h-full gap-4 rounded-2xl p-6 transition hover:border-teal/40 ${
    past ? "opacity-70" : ""
  }`;
  const body = (
    <>
      {a.url && (
        <LinkTypeIcon
          kind={linkKindForUrl(a.url)}
          className={`absolute right-4 top-4 h-4 w-4 ${style.text} opacity-40 transition group-hover:opacity-90`}
        />
      )}
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
        <p className="mt-2 font-mono text-xs leading-relaxed text-mist">
          {a.date} · {a.location}
        </p>
        {a.note && <p className="mt-3 text-sm leading-relaxed text-teal">{a.note}</p>}
      </div>
    </>
  );

  // id + scroll-mt: the hero constellation deep-links individual talks as
  // /appearances#<slug>, and these cards are the only thing they can land on —
  // there is no per-appearance route. scroll-mt clears the fixed header, which
  // would otherwise cover the card the visitor was sent to.
  if (!a.url) {
    return <div id={a.slug} className={`scroll-mt-32 ${className}`}>{body}</div>;
  }

  return (
    <a id={a.slug} href={a.url} target="_blank" rel="noopener noreferrer" className={`scroll-mt-32 ${className}`}>
      {body}
    </a>
  );
}

export default function AppearancesSection() {
  if (appearances.length === 0) return null;

  // Split on each entry's own end time so a finished talk stops claiming to be
  // "what's next" the day after it happens — no manual edit required.
  const { upcoming, past } = partitionAppearances();
  const recent = past.slice(0, 4);

  return (
    <section id="appearances" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <p className="font-mono text-sm text-teal">
          {upcoming.length > 0 ? "what's next" : "where he's been"}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          {upcoming.length > 0 ? <>Upcoming <span className="grad-text">hellos.</span></> : <>Find Alex <span className="grad-text">in the wild.</span></>}
        </h2>
        <p className="mt-3 max-w-2xl text-mist">
          {upcoming.length > 0
            ? "A few places we can cross paths this fall. Come say hello — I’d love to hear what you’re building."
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
