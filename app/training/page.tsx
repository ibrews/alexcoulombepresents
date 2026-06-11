import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import LiteVideo from "@/components/LiteVideo";
import { courses, trainingPlaylist } from "@/lib/data";

export const metadata: Metadata = {
  title: "Unreal Engine Training",
  description:
    "Learn Unreal Engine from a top-rated Epic Games Authorized Instructor at Manhattan's first Unreal Authorized Training Center. AI for Unreal, Blueprints, VR/AR, MetaHumans, and more.",
};

export default function Training() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/training</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Learn Unreal from someone who <span className="grad-text">ships with it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Alex is a top-rated <strong className="text-snow">Epic Games Authorized Instructor</strong>{" "}
          running <strong className="text-snow">Manhattan&apos;s first Unreal Authorized Training
          Center</strong>, in association with Agile Lens. Not slideware — the curriculum comes from a
          decade of real client work: photoreal archviz, live virtual production, multiplayer VR, and
          now AI-driven workflows.
        </p>
      </Reveal>

      {/* Format strip */}
      <Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-teal">FORMAT</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Live, two-hour classes — à la carte or as curriculum bundles. Solo deep-dives or team
              training for studios.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-grape">SCHEDULE</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Intro classes typically run the first Monday of the month at 1pm ET, with additional
              sessions throughout the week.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="font-mono text-xs text-amber">CREDENTIALS</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Unreal Authorized Instructor + Authorized Training Center — certified by Epic Games, in
              the building since UE4.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Curriculum */}
      <div className="mt-20">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">The curriculum</h2>
          <p className="mt-3 text-mist">Eleven tracks. Take one, take them all, or tell me what your team needs.</p>
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
                <p className="mt-2 text-sm leading-relaxed text-mist">{c.blurb}</p>
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
            <p className="mt-3 leading-relaxed text-mist">{trainingPlaylist.blurb}</p>
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

      {/* Why train here */}
      <Reveal>
        <div className="glass mt-20 rounded-3xl p-10 md:p-14">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Why learn here and not from a 40-hour video course?
          </h2>
          <div className="mt-6 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-3">
            <p>
              <strong className="text-snow">It&apos;s alive.</strong> Classes adapt to your actual
              project. Bring your broken Blueprint, your janky lighting, your VR comfort problem —
              we fix real things in real time.
            </p>
            <p>
              <strong className="text-snow">It&apos;s current.</strong> The new AI for Unreal Engine
              class covers MCP servers and AI build agents — material that didn&apos;t exist a year ago
              and that Alex is actively building in public.
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
              Alex leads the NYC Unreal Engine meetup — talks, demos, and the only room in Manhattan
              where &quot;nanite&quot; is small talk. Come say hi before committing to a class.
            </p>
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
          </div>
        </div>
      </Reveal>
    </div>
  );
}
