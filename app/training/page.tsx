import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import LiteVideo from "@/components/LiteVideo";
import JsonLd from "@/components/JsonLd";
import { courses, trainingPlaylist } from "@/lib/data";
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
          <p className="mt-3 text-mist">Eleven tracks. Take one, take them all, or tell us what your team needs.</p>
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
            Courses I built <span className="grad-text">for Epic Games.</span>
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-mist">
            Separate from Agile Lens, over eight years Alex collaborated on 50+ official Epic Games
            courses. Some of the once-gated ones are finally coming online to the public — here are
            a few worth your time.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            {
              kind: "Video",
              name: "Intro to OpenXR",
              note: "The very first — adapted for Unreal Fest 2022.",
              href: "https://youtu.be/JD95BklloHk",
            },
            {
              kind: "Course",
              name: "FBX: Data Ingestion",
              note: "Getting FBX data into Unreal cleanly.",
              href: "https://dev.epicgames.com/community/learning/courses/Lre/unreal-engine-fbx-data-ingestion/qEL5/unreal-engine-introduction",
            },
            {
              kind: "Course",
              name: "Datasmith Ingestion",
              note: "Bringing CAD and DCC scenes in via Datasmith.",
              href: "https://dev.epicgames.com/community/learning/courses/7Na/unreal-engine-datasmith-ingestion/L0YB/unreal-engine-introduction",
            },
            {
              kind: "Talk",
              name: "Mind the Gap: Transitioning from Unity to Unreal",
              note: "Led by Whitt Sellers.",
              href: "https://dev.epicgames.com/community/learning/talks-and-demos/0yX9/unreal-engine-mind-the-gap-transitioning-from-unity-to-unreal",
            },
            {
              kind: "Course",
              name: "Using Magic Leap in Unreal Engine",
              note: "A 2019 classic that's still surprisingly relevant.",
              href: "https://dev.epicgames.com/community/learning/courses/Ml7/using-magic-leap-in-unreal-engine/pbx/introducing-using-magic-leap-in-unreal-engine",
            },
          ].map((c, i) => (
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
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="mailto:info@alexcoulombepresents.com?subject=Unreal%20Engine%20Training"
              className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              Book a class →
            </a>
            <a
              href="mailto:info@alexcoulombepresents.com?subject=Team%20Training%20Inquiry"
              className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-teal/60"
            >
              Team / studio training
            </a>
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
              <a href="https://youtube.com/user/ibrews" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
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
