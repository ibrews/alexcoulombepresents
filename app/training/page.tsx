import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import LiteVideo from "@/components/LiteVideo";
import InterestForm from "@/components/InterestForm";
import InquireButton from "@/components/InquireButton";
import HashScroll from "@/components/HashScroll";
import JsonLd from "@/components/JsonLd";
import CounterStat from "@/components/CounterStat";
import TestimonialWall from "@/components/TestimonialWall";
import TrainingSurveyForm from "@/components/TrainingSurveyForm";
import TrainingCalendar from "@/components/TrainingCalendar";
import { getCurriculumEntries } from "@/lib/curriculum";
import { courses, taughtCatalog, trainingPlaylist, aiTopics, aiTalk, epicCourses } from "@/lib/data";
import { renderBreaks } from "@/components/Lines";
import { trainingCourse } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Unreal Engine Training in NYC",
  description:
    "Learn Unreal Engine from a top-rated Epic Games Authorized Instructor at Manhattan's first Unreal Authorized Training Center. AI for Unreal, Blueprints, VR/AR including Vision Pro, MetaHumans, ArchViz, virtual production, and much much more.",
  alternates: { canonical: "/training" },
};

// The Aug 5 session is a single dated event, and its Zoom link is a
// single-occurrence registration — past it, both the date and the CTA are
// dead. The next session isn't on the calendar yet, so the card falls back to
// the standing rhythm and the poll instead of inventing a date. When the next
// one IS scheduled: bump this, swap in the new Zoom link, and the dated copy
// comes back on its own.
const FREE_CLASS_ENDS_ISO = "2026-08-05T17:00:00Z"; // Aug 5, 11a ET + ~2h
const FREE_CLASS_ZOOM = "https://us06web.zoom.us/meeting/register/BpUpfAPDToWFUyqRgPFwXA";

// Without this the date check above would freeze at build time.
export const revalidate = 3600;

export default function Training() {
  const aiClasses = getCurriculumEntries().filter((entry) => entry.status === "teasing");
  const freeClassAhead = Date.now() < new Date(FREE_CLASS_ENDS_ISO).getTime();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <JsonLd data={trainingCourse} />
      <HashScroll />
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/training</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Learn Unreal from someone who <span className="grad-text">ships with it every day.</span>
        </h1>
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
          <p className="max-w-2xl text-lg leading-relaxed text-mist">
            Alex is a top-rated <strong className="text-snow">Epic Games Authorized Instructor</strong>{" "}
            running <strong className="text-snow">Manhattan&apos;s first Unreal Authorized Training
            Center</strong>, in association with{" "}
            <a
              href="https://agilelens.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-snow underline decoration-teal/50 hover:decoration-teal"
            >
              Agile Lens
            </a>
            . He has developed or co-developed 50+
            courses and taught 300+ courses on behalf of Epic Games to their key partners. Our
            curriculums come from those lessons merged with nearly a decade of real client work from
            Agile Lens in Unreal: photoreal archviz, live stage shows, multiplayer VR, and now
            AI-driven workflows. You&apos;ll learn methodologies you won&apos;t find anywhere else.
            Expect special guest instructors too — specialists from Agile Lens and beyond, brought in
            whenever a topic calls for someone who lives it every day.
          </p>
          <LiteVideo id="FW6xfFzF0_o" title="Watch: Alex Coulombe teaching Unreal Engine" />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div id="cohort" className="glow-card mt-10 max-w-2xl rounded-2xl border border-teal/40 p-6">
          {/* Both states spell their copy out as JSX text rather than as
              ternary string operands — scripts/gen-content.mjs only sees the
              former, and copy that's invisible to CONTENT.md can't be edited
              there. */}
          {freeClassAhead ? (
            <p className="font-mono text-xs tracking-widest text-teal">
              FREE CLASS · WEDNESDAY, AUGUST 5 · 11A ET
            </p>
          ) : (
            <p className="font-mono text-xs tracking-widest text-teal">
              LIVE CLASSES · WEDNESDAYS 11A ET · OFFICE HOURS FRIDAYS 1P ET
            </p>
          )}
          {freeClassAhead ? (
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Live Unreal class — free, and we&apos;re deciding what comes next together
            </h2>
          ) : (
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Live Unreal classes — and you decide what they cover
            </h2>
          )}
          {freeClassAhead ? (
            <p className="mt-3 leading-relaxed text-mist">
              One live session, no cost, no catch: a tour of what Alex knows in Unreal, a look at
              what&apos;s new in 5.8, and an open Q&amp;A. From here on it&apos;s a standing weekly
              rhythm — a live class every <strong className="text-snow">Wednesday at 11a ET</strong>,
              plus <strong className="text-snow">office hours every Friday at 1p ET</strong>. What
              the paid weeks actually cover is exactly what the poll below decides.
            </p>
          ) : (
            <p className="mt-3 leading-relaxed text-mist">
              The free kickoff session has happened, and the rhythm it started continues: a live
              class every <strong className="text-snow">Wednesday at 11a ET</strong>, plus{" "}
              <strong className="text-snow">office hours every Friday at 1p ET</strong>. The next
              eight Wednesdays are on the calendar below at introductory pricing — book any of them
              right now. After that run, what gets taught is exactly what the poll decides.
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {freeClassAhead ? (
              <>
                <a
                  href={FREE_CLASS_ZOOM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-teal px-6 py-2.5 font-semibold text-[#0a0a12] transition hover:opacity-90"
                >
                  Reserve a free seat →
                </a>
                <a href="#poll" className="font-mono text-xs text-mist hover:text-snow">
                  Help decide what&apos;s next →
                </a>
              </>
            ) : (
              <a
                href="#calendar"
                className="inline-block rounded-full bg-teal px-6 py-2.5 font-semibold text-[#0a0a12] transition hover:opacity-90"
              >
                See the calendar →
              </a>
            )}
          </div>
        </div>
      </Reveal>

      {/* Credentials / badges */}
      <Reveal>
        <div className="glass mt-10 rounded-3xl px-6 py-10 text-center md:px-10">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">
            Certified by Epic Games
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Authorized, and re-authorized <span className="grad-text">every year.</span>
          </h2>

          {/* Headline credentials */}
          <div className="mt-9 flex flex-wrap items-end justify-center gap-x-12 gap-y-8">
            {[
              {
                src: "authorized-instructor",
                alt: "Unreal Engine Authorized Instructor",
                href: "https://credential.unrealengine.com/ae75c735-f7c6-4fc5-a633-f400ec2efd4b#acc.Mpe8GrAh",
              },
              {
                src: "authorized-training-center",
                alt: "Unreal Engine Authorized Training Center",
                href: "https://credential.unrealengine.com/2e350d0f-ee6d-4239-a596-975ff749d550#acc.H86EwZ9F",
              },
            ].map((b) => (
              <a
                key={b.src}
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-[1.04]"
                title={`Verify: ${b.alt}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badges/${b.src}.png`}
                  alt={b.alt}
                  className="h-36 w-auto select-none md:h-44"
                />
              </a>
            ))}
          </div>

          {/* Yearly partner tiers */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-9 gap-y-7">
            {[
              "instructor-partner-2024",
              "instructor-partner-2025",
              "instructor-partner-2026",
              "training-partner-2024",
              "training-partner-2025",
              "training-partner-2026",
            ].map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={`/badges/${src}.png`}
                alt={src.replace(/-/g, " ")}
                className="h-20 w-auto select-none md:h-24"
              />
            ))}
          </div>
        </div>
      </Reveal>

      <TrainingCalendar />

      {/* ── The poll — what to actually teach and how to sell it ── */}
      <Reveal delay={40}>
        <section id="poll" className="glow-card mt-10 scroll-mt-28 max-w-3xl rounded-3xl border border-grape/40 p-6 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">3 quick questions</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Help shape the program.
          </h2>
          <p className="mt-3 leading-relaxed text-mist">
            This is about the program, not the syllabus: how you&apos;d rather pay for classes,
            how much AI you want woven in, and your skill level — it shapes pricing, format, and
            the AI-vs-Unreal balance. Looking to vote on a specific topic instead?{" "}
            <Link href="/vote" className="text-snow underline decoration-grape/50 hover:decoration-grape">
              That&apos;s what /vote is for →
            </Link>
          </p>
          <div className="mt-8">
            <TrainingSurveyForm />
          </div>
        </section>
      </Reveal>

      {/* Numbers that matter — same stat tiles the about page earns trust with */}
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { n: "300+", label: "Unreal Engine courses taught" },
          { n: "50+", label: "official Epic Games courses co-created" },
          { n: "80+", label: "conference talks worldwide" },
          { n: "1400+", label: "Unreal NYC meetup members" },
        ].map((s, i) => (
          <CounterStat key={s.label} n={s.n} label={s.label} delay={i * 80} />
        ))}
      </div>

      <TestimonialWall />

      {/* ── Company / team training — the headline offer ── */}
      <Reveal delay={40}>
        <section
          id="teams"
          className="glow-card mt-10 scroll-mt-28 rounded-3xl border border-amber/40 p-8 md:p-12"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-amber">
            Company & studio training · bundled curricula
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Represent a team? This is the fast lane.
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-mist">
            Custom multi-week curricula assembled from the{" "}
            <a href="#catalog" className="text-snow underline decoration-amber/50 hover:decoration-amber">
              50+ ready-to-teach classes
            </a>{" "}
            below — the same live, hands-on training delivered on behalf of Epic Games to their key
            partner studios, broadcast graphics teams, and enterprises. Live over Zoom or on-site,
            cloud workstations available for every learner, Q&amp;A sessions woven between modules.
            Pricing varies with team size, class count, and scheduling — tell us what your team
            needs and you&apos;ll have a scoped quote fast.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <InquireButton
              label="Request a team quote →"
              list="team-training"
              context="Company / team training quote"
              withMessage
              successMessage="Alex will follow up with a scoped quote — usually within a day."
            />
            <a
              href="mailto:info@alexcoulombepresents.com?subject=Team%20training%20quote"
              className="font-mono text-xs text-mist hover:text-snow"
            >
              or email info@alexcoulombepresents.com
            </a>
          </div>
        </section>
      </Reveal>

      {/* Format strip */}
      <Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-teal">FORMAT</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Live and interactive over Zoom, two hours — follow along, not a watch-along webinar.
              Reference files go out before class when a session needs them, and every session is
              recorded for you. À la carte or as curriculum bundles; solo deep-dives or team training
              for entire studios.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-grape">SCHEDULE</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Live classes run every Wednesday at 11a ET, plus office hours every Friday at 1p ET —
              see the full calendar above.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-amber">CREDENTIALS</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Unreal Authorized Instructor + Authorized Training Center — certified by Epic Games.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Curriculum */}
      <div className="mt-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-grape">
            Not the Wednesday calendar — book individually, on your schedule
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">The curriculum</h2>
          <p className="mt-3 text-mist">
            Twelve tracks, separate from the public Wednesday cohort above. Every one books as its
            own live two-hour session — intro tracks and specialized deep-dives, priced separately —
            scheduled around you instead of on a fixed public date. Inquire below, or bundle them for
            your team above. Pricing shows at checkout in the{" "}
            <Link href="/store" className="text-snow underline decoration-teal/50 hover:decoration-teal">
              store
            </Link>
            . Want a topic added to the public Wednesday run instead?{" "}
            <Link href="/vote" className="text-snow underline decoration-teal/50 hover:decoration-teal">
              Vote on what&apos;s next →
            </Link>
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <Reveal key={c.name} delay={Math.min(i * 50, 300)}>
              <div className="glass relative flex h-full flex-col rounded-2xl p-6">
                {c.isNew && (
                  <span className="absolute -top-2.5 right-5 rounded-full bg-amber px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
                    New
                  </span>
                )}
                <h3 className="font-bold">{c.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{renderBreaks(c.blurb)}</p>
                <Link
                  href="/store"
                  className={`mt-4 self-start rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                    c.tier === "intro"
                      ? "border-teal/40 text-teal hover:border-teal"
                      : "border-grape/40 text-grape hover:border-grape"
                  }`}
                >
                  {c.tier === "intro" ? "Inquire about this intro session →" : "Inquire about this advanced session →"}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Ready-to-teach catalog */}
      <div id="catalog" className="mt-20 scroll-mt-28">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">
            The full teaching catalog · book individually, on your schedule
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            50+ classes, <span className="grad-text">ready to run.</span>
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-mist">
            Every class below has been taught live — most many times over — as two-hour,
            instructor-led sessions on behalf of Epic Games to their key partner studios, broadcast
            teams, and enterprises. These aren&apos;t on the public Wednesday calendar above — inquire
            about any of them as a one-off open-enrollment session scheduled around you, or point at
            a column and say &quot;that one, for my whole team.&quot;
          </p>
        </Reveal>
        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {taughtCatalog.map((group) => (
            <div key={group.category} className="glass break-inside-avoid rounded-2xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-widest text-teal">
                {group.category}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.classes.map((cls) => (
                  <li key={cls} className="flex gap-2.5 text-sm leading-snug text-mist">
                    <span className="mt-0.5 text-teal/70">✦</span>
                    <span>{cls}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Reveal>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/store"
              className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              Inquire about booking a class →
            </Link>
            <a
              href="#teams"
              className="rounded-full border border-amber/50 px-6 py-3 font-semibold text-amber transition-colors hover:border-amber"
            >
              Bundle these for your team →
            </a>
          </div>
        </Reveal>
      </div>

      {/* Try before you book */}
      <Reveal>
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Try the teaching first</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{trainingPlaylist.title}</h2>
            <p className="mt-3 leading-relaxed text-mist">{renderBreaks(trainingPlaylist.blurb)}</p>
            <a
              href={`https://www.youtube.com/playlist?list=${trainingPlaylist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
            >
              All {trainingPlaylist.count} talks on YouTube →
            </a>
          </div>
          <LiteVideo
            id={trainingPlaylist.featuredVideoId}
            title="I Wish I Learned This Sooner! Part 2 — Unreal Fest Stockholm 2025"
          />
        </div>
      </Reveal>

      {/* Official Epic Games courses */}
      <div className="mt-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-grape">
            From the Epic Games archives
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Courses built <span className="grad-text">for Epic Games.</span>
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-mist">
            Separate from Agile Lens, over eight years Alex collaborated on 50+ official Epic Games
            courses. Some of the once-gated ones are finally coming online to the public — here are
            a few worth your time.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {epicCourses.map((c, i) => (
            <Reveal key={c.name} delay={Math.min(i * 60, 300)}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:border-grape/40"
              >
                <span className="self-start rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist">
                  {c.kind}
                </span>
                <h3 className="mt-3 font-bold leading-snug">{c.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{c.note}</p>
                <span className="mt-3 font-mono text-xs text-grape transition-colors group-hover:text-snow">
                  {c.kind === "Video" ? "Watch on YouTube →" : "Open on Epic Dev Community →"}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Learn AI */}
      <section id="learn-ai" className="mt-20 scroll-mt-28">
        <Reveal>
          <div className="glass overflow-hidden rounded-3xl p-8 md:p-12">
            <p className="font-mono text-xs uppercase tracking-widest text-grape">AI training · its own track</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Learn AI workflows, <span className="grad-text">Unreal optional.</span>
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-mist">
              This is its own thing — you don&apos;t need to care about Unreal Engine to take it. Agile
              Lens runs a fleet of machines with AI agents shipping real production work around the
              clock without breaking the bank, and the plan is to teach that the way the Unreal classes
              already do: live, hands-on, on your own project, whatever you&apos;re building.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist">
              Learning Unreal with Alex? AI comes woven in. Here purely for AI? Unreal only shows up if
              your use case actually calls for it. Formal AI classes aren&apos;t scheduled yet — tell us
              what you&apos;d want and you&apos;ll be first to know.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aiTopics.map((c) => (
                <div key={c.t} className="rounded-2xl border border-line p-5">
                  <h3 className="text-sm font-bold">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{c.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <p className="font-mono text-xs uppercase tracking-widest text-teal">AI classes are coming</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {aiClasses.map((entry) => (
                  <div key={entry.slug} className="rounded-2xl border border-line p-5">
                    <Link href={`/curriculum/${entry.slug}`} className="group block">
                      <h3 className="font-bold text-snow group-hover:text-teal">{entry.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-mist">{entry.tagline}</p>
                    </Link>
                    <div className="mt-5">
                      <InquireButton
                        list="ai"
                        label="Tell me when this runs →"
                        context={entry.title}
                        successMessage="You'll hear when this class is scheduled."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <LiteVideo id={aiTalk.videoId} title={aiTalk.title} />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-grape">{aiTalk.host}</p>
                <h3 className="mt-2 text-xl font-bold tracking-tight">{aiTalk.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{aiTalk.blurb}</p>
                <a
                  href={`https://www.youtube.com/watch?v=${aiTalk.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-grape/60"
                >
                  Watch the full talk →
                </a>
              </div>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-grape/30 bg-grape/5 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-grape">Learn AI</p>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  Get notified the moment AI sessions open — and help shape what they cover.
                </p>
                <div className="mt-4">
                  <InterestForm track="ai" withMessage />
                </div>
              </div>
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-teal">Learn Unreal</p>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  Classes run now — but if you&apos;d rather be pinged about upcoming cohorts than book
                  today, hop on the Unreal list.
                </p>
                <div className="mt-4">
                  <InterestForm track="unreal" withMessage />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Why train here */}
      <Reveal>
        <div className="glass mt-20 rounded-3xl p-10 md:p-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Why learn here and not from an on-demand video course?
          </h2>
          <div className="mt-6 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-3">
            <p>
              <strong className="text-snow">It&apos;s alive.</strong> Classes adapt to your actual
              project. Bring your broken Blueprint, your janky lighting, your VR comfort problem —
              we fix real things in real time.
            </p>
            <p>
              <strong className="text-snow">It&apos;s current.</strong> The new AI for Unreal Engine
              class covers MCP servers and AI build agents — practical workflows that we stay on the
              cutting edge of.
            </p>
            <p>
              <strong className="text-snow">It&apos;s proven.</strong> The same techniques drove
              nine-figure real-estate sales, RSC rehearsals, and TestFlight-shipping Vision Pro apps.
              You&apos;re learning the production path, not the tutorial path.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/store"
              className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              Book a class — instant checkout →
            </Link>
            <a
              href="#teams"
              className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-amber/60"
            >
              Team / studio training
            </a>
          </div>
        </div>
      </Reveal>

      {/* Membership — the strongest promotion of it on the page */}
      <Reveal>
        <section className="glow-card mt-16 rounded-3xl border border-grape/40 p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-grape">
              Membership · shipping today
            </p>
            <span className="rounded-full bg-grape px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
              Cheapest way in!
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
            Members save — <span className="grad-text">and get more.</span>
          </h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-mist">
            Starter is $99/mo for 3 live-class credits — cheaper than buying a single class à la
            carte — plus every class recording, member pricing sitewide, and a vote that counts for
            more. On top of that: hands-on access to real internal tools Alex builds for production
            work — xrsim (test VR apps without a headset), Forage (an AI-first
            scout for the Unreal asset packs you already own), and Constellation (your own notes as
            a walk-in 3D star map on Vision Pro) are shipping today, with more landing as
            they&apos;re ready.
          </p>
          <Link
            href="/members"
            className="mt-6 inline-block rounded-full bg-grape px-6 py-3 font-semibold text-[#0a0a12] transition-transform hover:scale-[1.03]"
          >
            See tiers & join →
          </Link>
        </section>
      </Reveal>

      {/* Community */}
      <Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <div className="glass rounded-2xl p-7">
            <h3 className="font-bold">Unreal NYC</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Alex and Agile Lens lead the NYC Unreal Engine meetup — talks, demos, pizza, and swag.
              Come meet the community before committing to a class.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://agilelens.com/unrealnyc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-3.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/unreal-nyc.png" alt="" className="h-5 w-5 rounded-full" />
                agilelens.com/unrealnyc ↗
              </a>
              <a
                href="https://communities.unrealengine.com/new-york"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-3.5 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
                Epic community page ↗
              </a>
            </div>
          </div>
          <div className="glass rounded-2xl p-7">
            <h3 className="font-bold">Free stuff first</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              iBrews (
              <a href="https://youtube.com/@ibrews" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>{" "}
              /{" "}
              <a href="https://twitter.com/ibrews" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
                X
              </a>
              ) and{" "}
              <a href="https://uepodcast.com" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
                The (Unofficial) Unreal Engine Podcast
              </a>{" "}
              are free. Start there, then bring your questions to class.
            </p>
            <div className="mt-4">
              <a
                href="https://linktr.ee/unoffunrealpod"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-3.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/ue-podcast.jpg" alt="" className="h-5 w-5 rounded-full" />
                Podcast on all platforms ↗
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
