import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import { upcomingSessions, pastSessions, calendarBreaks, type ClassSession } from "@/lib/classSessions";
import { instructorNames } from "@/lib/instructors";
import { sessionWhen, newYorkParts } from "@/lib/sessionCalendar";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Classes",
  description:
    "Every live Unreal class, office hours, and livestream from Alex Coulombe Presents — who's teaching, when, and what each past session covered.",
  alternates: { canonical: "/classes" },
};

// No prices on the site for classes — Stripe Checkout shows them.
function ctaLabel(s: ClassSession): string {
  return s.kind === "livestream" ? "Free · Details →" : "Book a seat · Details →";
}

const KIND: Record<ClassSession["kind"], string> = {
  class: "Live class",
  "office-hours": "Office hours",
  livestream: "Free livestream",
};

function SessionCard({ s, past }: { s: ClassSession; past?: boolean }) {
  return (
    <Link
      href={`/classes/${s.slug}`}
      className={`glass flex flex-col rounded-2xl border p-5 transition-colors ${
        s.kind === "livestream" ? "border-amber/40 hover:border-amber/70" : "border-teal/20 hover:border-teal/50"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-teal">
        {KIND[s.kind]} · {sessionWhen(s)}
      </span>
      <span className="mt-2 font-bold leading-snug">{s.title}</span>
      <span className="mt-1 text-xs text-snow">with {instructorNames(s.instructorIds)}</span>
      <span className="mt-2 flex-1 text-xs leading-relaxed text-mist">{s.blurb}</span>
      <span className="mt-4 font-mono text-xs text-grape">
        {past ? (s.recordingSlug ? "What we covered →" : "Details →") : ctaLabel(s)}
      </span>
    </Link>
  );
}

export default function ClassesPage() {
  const upcoming = upcomingSessions();
  const past = pastSessions();
  const now = Date.now();
  const breaks = calendarBreaks.filter((b) => Date.parse(`${b.dateISO}T23:59:59-05:00`) > now);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-widest text-teal">/classes</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Every class, <span className="grad-text">its own page.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-mist">
          Live on Zoom, Wednesdays at 11a ET, plus Friday office hours and the occasional free livestream. Each page
          says who&apos;s teaching and when — and once a session has happened, what it covered.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/training#calendar"
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            Book from the calendar →
          </Link>
          <Link
            href="/members"
            className="rounded-full border border-grape/50 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape"
          >
            Or become a member to access everything!
          </Link>
        </div>
      </Reveal>

      <Reveal>
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-mist">
              The next run is being planned —{" "}
              <Link href="/vote" className="underline decoration-grape/50 hover:decoration-grape">
                vote on what&apos;s taught next
              </Link>
              .
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((s) => (
                <SessionCard key={s.slug} s={s} />
              ))}
              {breaks.map((b) => {
                const { weekday, date } = newYorkParts(`${b.dateISO}T16:00:00Z`);
                return (
                  <div key={b.dateISO} className="flex flex-col rounded-2xl border border-dashed border-line p-5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
                      {weekday}, {date}
                    </span>
                    <span className="mt-2 font-bold leading-snug text-mist">{b.title}</span>
                    <span className="mt-2 text-xs leading-relaxed text-mist">{b.note}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </Reveal>

      {past.length > 0 && (
        <Reveal>
          <section className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight">Past sessions</h2>
            <p className="mt-2 max-w-3xl text-sm text-mist">
              Every one was recorded. Members watch them all in the{" "}
              <Link href="/members/recordings" className="underline decoration-teal/50 hover:decoration-teal">
                recordings library
              </Link>
              .
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((s) => (
                <SessionCard key={s.slug} s={s} past />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}
