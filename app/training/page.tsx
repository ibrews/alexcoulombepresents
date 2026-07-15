import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import LiteVideo from "@/components/LiteVideo";
import InterestForm from "@/components/InterestForm";
import InquireButtonGroup from "@/components/InquireButtonGroup";
import HashScroll from "@/components/HashScroll";
import JsonLd from "@/components/JsonLd";
import { courses, trainingPlaylist, aiTopics, aiTalk, epicCourses } from "@/lib/data";
import { renderBreaks } from "@/components/Lines";
import { trainingCourse } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Unreal Engine Training in NYC",
  description:
    "Learn Unreal Engine from a top-rated Epic Games Authorized Instructor at Manhattan's first Unreal Authorized Training Center. AI for Unreal, Blueprints, VR/AR including Vision Pro, MetaHumans, ArchViz, virtual production, and much much more.",
  alternates: { canonical: "/training" },
};

export default function Training() {
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
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Alex is a top-rated <strong className="text-snow">Epic Games Authorized Instructor</strong>{" "}
          running <strong className="text-snow">Manhattan&apos;s first Unreal Authorized Training
          Center</strong>, in association with Agile Lens. He has collaborated on the creation of 50+
          courses and taught 300+ sessions on behalf of Epic Games to their key partners. Our
          curriculums come from those lessons merged with nearly a decade of real client work from
          Agile Lens in Unreal: photoreal archviz, live stage shows, multiplayer VR, and now
          AI-driven workflows. You&apos;ll learn methodologies you won&apos;t find anywhere else.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div id="cohort" className="glow-card mt-10 max-w-2xl rounded-2xl border border-teal/40 p-6">
          <p className="font-mono text-xs tracking-widest text-teal">
            NEXT COHORT · STARTS WEDNESDAY, AUGUST 5
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Unreal Foundations — Zero to Environment
          </h2>
          <p className="mt-3 leading-relaxed text-mist">
            Four live Wednesday classes, each taught twice so the whole world can attend (10a–12p
            and 12:30–2:30p ET), plus Thursday office hours. Week 1: the editor &amp; ecosystem.
            Week 2: world building with Megascans &amp; Nanite. Week 3: Lumen &amp; lighting. Week 4:
            cameras &amp; Movie Render Queue — you leave with a portfolio-ready render. Recordings
            and project files included.
          </p>
          <a
            href="/store"
            className="mt-5 inline-block rounded-full bg-teal px-6 py-2.5 font-semibold text-[#0a0a12] transition hover:opacity-90"
          >
            Reserve a seat — $249 early-bird through Jul 29
          </a>
        </div>
      </Reveal>

      {/* Format strip */}
      <Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-teal">FORMAT</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Live, two-hour classes — à la carte or as curriculum bundles. Solo VIP deep-dives or team
              training for entire studios.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-grape">SCHEDULE</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Intro classes typically start on the first Monday of the month at 1pm ET, with additional
              sessions throughout the week.
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

      {/* Credentials / badges */}
      <Reveal>
        <div className="glass mt-12 rounded-3xl px-6 py-10 text-center md:px-10">
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

      {/* Curriculum */}
      <div className="mt-20">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">The curriculum</h2>
          <p className="mt-3 text-mist">Twelve tracks. Take one, take them all, or tell us what your team needs.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <Reveal key={c.name} delay={Math.min(i * 50, 300)}>
              <div className="glass relative h-full rounded-2xl p-6">
                {c.isNew && (
                  <span className="absolute -top-2.5 right-5 rounded-full bg-amber px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
                    New
                  </span>
                )}
                <h3 className="font-bold">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{renderBreaks(c.blurb)}</p>
              </div>
            </Reveal>
          ))}
        </div>
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
                  <InterestForm track="ai" />
                </div>
              </div>
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-teal">Learn Unreal</p>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  Classes run now — but if you&apos;d rather be pinged about upcoming cohorts than book
                  today, hop on the Unreal list.
                </p>
                <div className="mt-4">
                  <InterestForm track="unreal" />
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
          <div className="mt-10">
            <InquireButtonGroup
              list="unreal"
              withMessage
              options={[
                {
                  label: "Book a class →",
                  context: "Class booking",
                  successMessage: "Alex will be in touch to get you booked.",
                },
                {
                  label: "Team / studio training",
                  context: "Team / studio training",
                  successMessage: "Alex will be in touch about team training.",
                },
              ]}
            />
          </div>
        </div>
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
                className="rounded-full border border-line px-3.5 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
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
              The{" "}
              <a href="https://youtube.com/@ibrews" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
                YouTube channel
              </a>{" "}
              (&quot;I Wish I Learned This Sooner&quot;) and{" "}
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
                className="rounded-full border border-line px-3.5 py-1.5 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
                Podcast on all platforms ↗
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
