import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { timeline } from "@/lib/data";

export const metadata: Metadata = {
  title: "About Alex Coulombe",
  description:
    "Architect turned XR-chitect: a decade of immersive design across Unreal Engine, Godot, Apple Vision Pro, AI agents, and live theatre.",
};

const stats = [
  { n: "10+", label: "years of professional Unreal Engine" },
  { n: "30+", label: "conference talks worldwide" },
  { n: "90", label: "fps, locked, on Vision Pro — always" },
  { n: "1st", label: "VR theatrical sightline test, ever (2013)" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Reveal>
        <p className="font-mono text-sm text-teal">/about</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Trained as an architect. <span className="grad-text">Builds in dimensions buildings can&apos;t reach.</span>
        </h1>
      </Reveal>

      <Reveal>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5 text-lg leading-relaxed text-mist">
            <p>
              Alex Coulombe is the co-founder and CEO of{" "}
              <a href="https://agilelens.com" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
                Agile Lens
              </a>
              , a New York immersive design studio that one client described as &quot;an XR SEAL Team
              Six.&quot; He got here the long way: a B.Arch from Syracuse (with a drama minor that turned
              out to be load-bearing), years at Rafael Viñoly and ZGF designing real buildings, then a
              jump to theatre planning — where, in 2013, he strapped on an Oculus DK1 and ran the
              world&apos;s first VR theatrical sightline test. Nobody had told him you couldn&apos;t yet.
            </p>
            <p>
              Since then: photoreal VR holodecks that drove nine figures in pre-construction real estate
              sales, a mixed-reality rehearsal tool for the Royal Shakespeare Company, the Venice
              Biennale&apos;s first globally viewable live VR show, and an annual{" "}
              <em className="text-snow not-italic">A Christmas Carol VR</em> performed live in headsets
              every December since 2021. His SIGGRAPH-published research on multi-avatar performance
              comes from actually doing it on stage, not just writing about it.
            </p>
            <p>
              These days the obsession is the intersection of game engines, Apple Vision Pro, and AI
              agents: engine-level Unreal fixes for visionOS, the first publicly documented Godot
              physics game running at 90 fps on AVP hardware, and a fleet of machines running AI coding
              agents that build, test, and ship to TestFlight while he sleeps.
            </p>
            <p>
              He also teaches all of it — as a top-rated Epic Games Authorized Instructor running
              Manhattan&apos;s first Unreal Authorized Training Center, as the lead organizer of the
              Unreal NYC meetup, and as co-host of The (Unofficial) Unreal Engine Podcast.
            </p>
          </div>

          <div className="space-y-4">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6">
                <p className="grad-text text-4xl font-bold">{s.n}</p>
                <p className="mt-1 text-sm text-mist">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Timeline */}
      <div className="mt-24">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">The road so far</h2>
        </Reveal>
        <div className="mt-10 space-y-0">
          {timeline.map((t, i) => (
            <Reveal key={t.year + t.title} delay={Math.min(i * 60, 240)}>
              <div className="group relative grid gap-2 border-l border-line py-6 pl-8 md:grid-cols-[100px_1fr] md:gap-8">
                <span className="absolute -left-[5px] top-8 h-2.5 w-2.5 rounded-full bg-line transition-colors group-hover:bg-teal" />
                <p className="font-mono text-lg text-teal">{t.year}</p>
                <div>
                  <h3 className="font-bold">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{t.detail}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Fun facts */}
      <Reveal>
        <div className="mt-24 grid gap-5 md:grid-cols-3">
          <div className="glass rounded-2xl p-7">
            <p className="font-mono text-xs text-amber">UNNECESSARY DETAIL #1</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Has written, produced, designed, and acted in actual stage plays — including playing
              Albert Einstein in <em>Picasso at the Lapin Agile</em>. The theatre thing isn&apos;t a
              metaphor.
            </p>
          </div>
          <div className="glass rounded-2xl p-7">
            <p className="font-mono text-xs text-amber">UNNECESSARY DETAIL #2</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Co-designed published board games, including <em>The Rum Run</em>, and won a Game
              Crafter design contest in 2011. Systems thinking with cardboard.
            </p>
          </div>
          <div className="glass rounded-2xl p-7">
            <p className="font-mono text-xs text-amber">UNNECESSARY DETAIL #3</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Composes digital music as &quot;Idle Eyebrows.&quot; Plays voice, guitar, piano, and
              drums. The procedural soundtrack in Cascade Countdown was not a fluke.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
