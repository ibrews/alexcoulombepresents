import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import OriginVenn from "@/components/hxr/OriginVenn";
import PowerUpIntro from "@/components/hxr/PowerUpIntro";
import { AgileLensOrbit, ToolJourneyBurst } from "@/components/hxr/SpriteAnimations";
import CounterStat from "@/components/CounterStat";
import AvatarCorner from "@/components/hxr/AvatarCorner";
import { timeline } from "@/lib/data";

export const metadata: Metadata = {
  title: "About Alex Coulombe",
  description:
    "Architect turned XR-chitect: 16+ years of immersive design across Unity, Unreal Engine, Godot, live theatre, XR devices, and now: AI agents.",
  alternates: { canonical: "/about" },
};

const stats = [
  { n: "80+", label: "conference talks worldwide" },
  { n: "300+", label: "Unreal Engine courses taught" },
  { n: "100+", label: "projects shipped" },
  { n: "16+", label: "years in XR" },
  { n: "10+", label: "years of professional Unreal Engine" },
  { n: "1st", label: "VR theatrical sightline test, ever (2013)" },
  { n: "1400+", label: "Unreal NYC meetup members" },
  { n: "5", label: "live A Christmas Carol VR seasons" },
];

export default function About() {
  return (
    <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32">
      <AvatarCorner />
      <Ethereal variant="ghost" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/about</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Trained as a theatre architect. <span className="grad-text">Constructing a cognitive ladder to virtual experiences that go beyond the limitations of physical venues.</span>
        </h1>
      </Reveal>

      <Reveal>
        <div className="mt-12 max-w-3xl space-y-5 text-lg leading-relaxed text-mist">
          <p>
            Alex Coulombe is the co-founder and CEO of{" "}
            <a href="https://agilelens.com" className="text-snow underline decoration-teal/50 hover:decoration-teal" target="_blank" rel="noopener noreferrer">
              Agile Lens
            </a>
            , a New York immersive design studio that one client described as &quot;XR SEAL Team
            Six.&quot; With a B.Arch from Syracuse (with a drama minor that turned out to be
            load-bearing), and years at firms like Rafael Viñoly and Zimmer Gunsul Frasca designing real buildings,
            then a jump to Fisher Dachs Associates: Theatre Planning &amp; Design — where, in 2013,
            he strapped on an Oculus DK1 and pioneered the world&apos;s first VR theatrical sightline
            tests with a rigor to give all stakeholders confidence in the final design.
          </p>
          <p>
            Since co-founding Agile Lens with Joshua Dachs: photoreal VR holodecks driving nine
            figures in pre-construction real estate sales, a mixed-reality rehearsal tool for the
            Royal Shakespeare Company, and{" "}
            <em className="text-snow not-italic">A Christmas Carol VR</em> — five holiday seasons
            performed live in headsets, now retired as an annual show and living on as a recorded
            experience finding its way to{" "}
            <a
              href="https://apps.apple.com/us/app/a-christmas-carol-vr-teaser/id6738833389"
              className="text-snow underline decoration-teal/50 hover:decoration-teal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple Vision Pro
            </a>
            . SIGGRAPH-published research on VR performances come from hard-won lessons from real
            stages, not just theoretical ones.
          </p>
          <p>
            These days it&apos;s the interplay of game engines and AI agents: Unreal optimized for
            visionOS, pushing Godot to the limits of XR photorealism, and a fleet of machines running
            AI coding agents that build, test, and ship to TestFlight overnight.
          </p>
          <p>
            Alex also teaches all of it — as a top-rated Epic Games Authorized Instructor running
            Manhattan&apos;s first Unreal Authorized Training Center, as the lead organizer of the
            Unreal NYC meetup (1400+ members), and as host of The (Unofficial) Unreal Engine Podcast.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <CounterStat key={s.label} n={s.n} label={s.label} delay={i * 80} />
        ))}
      </div>

      {/* From the HarvardXR keynote — the origin story, in 8-bit */}
      <div className="mt-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-amber">
            Live from the HarvardXR 2026 closing keynote
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">The origin story, in 8-bit</h2>
          <p className="mt-3 max-w-2xl text-mist">
            These two interactive slides opened &quot;10 Lessons from 10 Years&quot; at Harvard in April 2026.
            2010 Alex pinballs between his three passions — until 2013 Alex finds the upgrade that
            merges them. Presentation built alongside{" "}
            <a
              href="https://github.com/ibrews/spatial-deck"
              className="text-snow underline decoration-teal/50 hover:decoration-teal"
              target="_blank"
              rel="noopener noreferrer"
            >
              Spatial Deck, a new kind of presentation tool
            </a>
            ;{" "}
            <a
              href="https://ibrews.github.io/harvardxr-keynote/"
              className="text-snow underline decoration-teal/50 hover:decoration-teal"
              target="_blank"
              rel="noopener noreferrer"
            >
              explore the whole presentation here
            </a>
            .
          </p>
        </Reveal>
        <Reveal>
          <div className="glass mt-8 rounded-3xl p-4 md:p-8">
            <OriginVenn />
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="glass rounded-3xl p-4">
              <PowerUpIntro />
            </div>
            <div>
              <h3 className="text-xl font-bold">2013: the power-up</h3>
              <p className="mt-3 leading-relaxed text-mist">
                Architecture, theatre, and realtime tech were three separate careers until a
                headset turned them into one. Press start and watch it happen — sound on for the
                full chiptune experience. (Every sound is synthesized live with the Web Audio
                API. No audio files were harmed.)
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">
              Fast-forward to 2026 · SensAI Hackademy
            </p>
            <h3 className="mt-3 text-xl font-bold">
              From power-up to pipeline
            </h3>
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="glass overflow-hidden rounded-3xl p-5 md:p-7">
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-mist">
                Agile Lens · est. 2016
              </p>
              <div className="mt-2">
                <AgileLensOrbit />
              </div>
            </div>
            <div className="glass overflow-hidden rounded-3xl p-5 md:p-7">
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-mist">
                Tool journey · expand — contract — expand
              </p>
              <div className="mt-2">
                <ToolJourneyBurst />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

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
              Has written, produced, designed, and acted in dozens of stage plays — including playing
              Albert Einstein in <em>Picasso at the Lapin Agile</em> (no relation to Agile Lens).
            </p>
          </div>
          <div className="glass rounded-2xl p-7">
            <p className="font-mono text-xs text-amber">UNNECESSARY DETAIL #2</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Has designed several board games since experimenting with architecture laser cutter scrap
              in 2008. Won The Game Crafter&apos;s Mash-Up Contest with <em>Rum Run</em>, a bootlegger
              cross between mancala and dominos.
            </p>
          </div>
          <div className="glass rounded-2xl p-7">
            <p className="font-mono text-xs text-amber">UNNECESSARY DETAIL #3</p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Kids have names that each only rhyme with one other word in the English language. Has
              written and performed songs for them with slant rhymes that stretch credulity.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
