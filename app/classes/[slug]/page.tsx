import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import BuyButton from "@/components/BuyButton";
import LocalSessionTime from "@/components/LocalSessionTime";
import { classSessions, sessionBySlug, sessionEndsISO, isPast, isUnlisted, upcomingSessions, type ClassSession } from "@/lib/classSessions";
import LiteVideo from "@/components/LiteVideo";
import { instructorById, instructorNames } from "@/lib/instructors";
import { storeItems, formatPrice, isPurchasable } from "@/lib/store";
import { recordings } from "@/lib/recordings";
import { sessionSummaries } from "@/lib/classSummaries";
import { googleCalendarUrl, sessionWhen } from "@/lib/sessionCalendar";

// Pages flip from "book a seat" to "what we covered" on their own once a
// session ends, so they can't be frozen at build time forever.
export const revalidate = 3600;

export function generateStaticParams() {
  return classSessions.map((s) => ({ slug: s.slug }));
}

const KIND_LABEL: Record<ClassSession["kind"], string> = {
  class: "Live class",
  "office-hours": "Office hours",
  livestream: "Free livestream",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = sessionBySlug(slug);
  if (!s) return {};
  const title = `${s.title} — with ${instructorNames(s.instructorIds)}`;
  return {
    title,
    description: `${sessionWhen(s)}. ${s.blurb}`,
    alternates: { canonical: `/classes/${s.slug}` },
    // Unlisted pages exist to be shared privately for review first.
    ...(isUnlisted(s) ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description: s.blurb, type: "website" },
    twitter: { card: "summary_large_image", title, description: s.blurb },
  };
}

function recordingFor(s: ClassSession) {
  return s.recordingSlug ? recordings.find((r) => r.slug === s.recordingSlug) : undefined;
}

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = sessionBySlug(slug);
  if (!s) notFound();

  const past = isPast(s);
  const item = s.storeSlug ? storeItems.find((i) => i.slug === s.storeSlug) : undefined;
  const purchasable = !past && s.kind === "class" && item ? isPurchasable(item) : false;
  const recording = recordingFor(s);
  const summary = recording?.youtubeId ? sessionSummaries[recording.youtubeId] : undefined;
  const people = s.instructorIds.map(instructorById);
  const more = upcomingSessions()
    .filter((x) => x.slug !== s.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/classes" className="font-mono text-sm text-mist hover:text-teal">
          ← all classes
        </Link>

        {isUnlisted(s) && (
          <p className="mt-6 rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-sm text-snow">
            Preview — this page isn&apos;t listed on the site yet. Thanks for taking a look.
          </p>
        )}
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-teal">
          {KIND_LABEL[s.kind]} · {s.level} · {s.durationMin / 60} hours{past ? " · Past session" : ""}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{s.title}</h1>
        <p className="mt-3 text-lg text-snow">
          with{" "}
          {people.map((p, i) => (
            <span key={p.id}>
              {i > 0 ? (i === people.length - 1 ? " & " : ", ") : ""}
              <a href={`#${p.id}`} className="font-semibold underline decoration-teal/50 hover:decoration-teal">
                {p.name}
              </a>
            </span>
          ))}
        </p>
        {s.instructorNote && !past && <p className="mt-1 text-sm text-mist">{s.instructorNote}</p>}

        <div className="mt-6 rounded-2xl border border-line p-5">
          <p className="text-lg font-bold text-snow">{sessionWhen(s)}</p>
          <LocalSessionTime startsISO={s.startsISO} endsISO={sessionEndsISO(s)} />
          <p className="mt-1 text-sm text-mist">
            {past
              ? s.kind === "livestream"
                ? "Streamed live on YouTube."
                : "Taught live on Zoom and recorded."
              : s.kind === "livestream"
                ? "Free and public on YouTube — no signup needed."
                : "Live and interactive on Zoom. Every seat includes the recording and class materials."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {purchasable && item && (
              <>
                {!item.hidePrice && <span className="text-2xl font-bold text-snow">{formatPrice(item.priceCents)}</span>}
                <BuyButton slug={item.slug} label="Book your seat →" itemName={item.name} />
                <Link
                  href="/members"
                  className="rounded-full border border-grape/50 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape"
                >
                  Members get in with their membership →
                </Link>
              </>
            )}
            {s.watchUrl && !past && (
              <a
                href={s.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                Watch live on YouTube →
              </a>
            )}
            {!past && (
              <>
                <a
                  href={googleCalendarUrl(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-teal/60"
                >
                  Add to Google Calendar
                </a>
                <a
                  href={`/classes/${s.slug}/calendar.ics`}
                  className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-teal/60"
                >
                  Download .ics
                </a>
              </>
            )}
            {past && recording && (
              <>
                <Link
                  href="/members/recordings"
                  className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  Members: watch the recording →
                </Link>
                <Link
                  href="/members"
                  className="rounded-full border border-grape/50 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape"
                >
                  Not a member? Every recording is included →
                </Link>
              </>
            )}
            {past && !recording && <span className="text-sm text-mist">The recording is being edited — it lands in the members&apos; library soon.</span>}
            {past && s.materialsSlug && (
              <Link
                href={`/materials/${s.materialsSlug}`}
                className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-teal/60"
              >
                Class materials
              </Link>
            )}
          </div>
          {purchasable && item?.priceNote && <p className="mt-4 text-xs leading-relaxed text-mist">{item.priceNote}</p>}
          {purchasable && (
            <p className="mt-2 text-xs leading-relaxed text-mist">
              Coming to more than one?{" "}
              <Link href="/members" className="underline decoration-grape/50 hover:decoration-grape">
                Membership
              </Link>{" "}
              covers live classes every month, plus every recording.
            </p>
          )}
        </div>
      </Reveal>

      {s.youtubeId && (
        <Reveal>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line">
            <LiteVideo id={s.youtubeId} title={s.title} />
          </div>
        </Reveal>
      )}

      <Reveal>
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">{past ? "About this session" : "About this class"}</h2>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-mist">{s.description}</p>
        </section>
      </Reveal>

      {!past && s.learn && (
        <Reveal>
          <section className="mt-10">
            <h2 className="text-2xl font-bold tracking-tight">What you&apos;ll learn</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {s.learn.map((l) => (
                <li key={l} className="glass rounded-xl border border-teal/20 px-4 py-3 text-sm leading-relaxed text-snow">
                  {l}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {past && summary && (
        <Reveal>
          <section className="mt-10">
            <h2 className="text-2xl font-bold tracking-tight">What we covered</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-mist">{summary.overview}</p>
            <ol className="mt-5 space-y-2">
              {summary.covered.map((c, i) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-snow">
                  <span className="font-mono text-teal">{String(i + 1).padStart(2, "0")}</span>
                  <span>{c}</span>
                </li>
              ))}
            </ol>
            {summary.tools.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {summary.tools.map((t) => (
                  <span key={t} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-mist">
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-mist">
              AI summary of the session recording&apos;s transcript — the recording itself is the source of truth.
            </p>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">{people.length > 1 ? "Your instructors" : "Your instructor"}</h2>
          <div className="mt-4 space-y-4">
            {people.map((p) => (
              <div id={p.id} key={p.id} className="glass flex scroll-mt-28 gap-4 rounded-2xl border border-line p-5">
                {p.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt="" className="h-20 w-20 shrink-0 rounded-full bg-white/5 object-cover object-top" />
                )}
                <div>
                  <p className="text-lg font-bold">{p.name}</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-teal">{p.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{p.bio}</p>
                  {p.links && p.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {p.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-snow underline decoration-teal/50 hover:decoration-teal"
                        >
                          {l.label} →
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {s.related && s.related.length > 0 && (
            <div className="mt-4 space-y-1">
              {s.related.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-snow underline decoration-grape/50 hover:decoration-grape"
                >
                  {r.label} →
                </a>
              ))}
            </div>
          )}
        </section>
      </Reveal>

      {more.length > 0 && (
        <Reveal>
          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight">Coming up next</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {more.map((m) => (
                <Link
                  key={m.slug}
                  href={`/classes/${m.slug}`}
                  className="glass flex flex-col rounded-2xl border border-teal/20 p-4 transition-colors hover:border-teal/50"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-teal">{sessionWhen(m)}</span>
                  <span className="mt-2 font-bold leading-snug">{m.title}</span>
                  <span className="mt-1 text-xs text-mist">with {instructorNames(m.instructorIds)}</span>
                </Link>
              ))}
            </div>
            <Link href="/training#calendar" className="mt-4 inline-block text-sm text-mist hover:text-teal">
              See the full calendar →
            </Link>
          </section>
        </Reveal>
      )}
    </div>
  );
}
