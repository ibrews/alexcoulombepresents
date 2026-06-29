import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import FaceField from "@/components/FaceField";
import Typewriter from "@/components/Typewriter";
import Reveal from "@/components/Reveal";
import RepoCard from "@/components/RepoCard";
import { repos, products, roles } from "@/lib/data";
import { renderBreaks } from "@/components/Lines";

const venues = [
  "SIGGRAPH", "HarvardXR", "Unreal Fest", "Venice Biennale", "AWE", "FMX",
  "NXT BLD", "Lincoln Center", "Autodesk University", "Raindance Immersive",
  "Park Avenue Armory", "Theatre Communications Group", "USITT", "NXT DEV",
  "NATEAC", "Opera America", "VRTO",
  "Columbia", "Princeton", "Cornell", "Yale",
];

export default function Home() {
  const featured = [...repos].sort((a, b) => b.stars - a.stars).slice(0, 6);

  return (
    <>
      <Ethereal variant="aurora" />
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <FaceField />
        <div className="orb left-[10%] top-[20%] h-72 w-72 bg-teal" />
        <div className="orb right-[12%] top-[40%] h-80 w-80 bg-grape" style={{ animationDelay: "-6s" }} />
        <div className="orb bottom-[10%] left-[40%] h-64 w-64 bg-amber" style={{ animationDelay: "-11s" }} />

        <div className="relative mx-auto w-full max-w-6xl px-5 pt-24 lg:pr-[38%]">
          <p className="mb-4 font-mono text-sm text-teal">~/alex-coulombe $ whoami</p>
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Building worlds you can <span className="grad-text">step inside.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist md:text-xl">
            Architect turned XR-chitect. 10+ yrs of running Agile Lens, 16+ yrs of immersive design
            across the built environment, live theatre, and emerging technology. Unreal Engine Gold
            Authorized Instructor. Now teaching machines to build alongside us.
          </p>
          <p className="mt-5 text-lg md:text-xl">
            Currently: <Typewriter words={roles} />
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/lab"
              className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              See what&apos;s cooking →
            </Link>
            <Link
              href="/training"
              className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-teal/60"
            >
              Learn Unreal with us
            </Link>
            <Link
              href="/repos"
              className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-grape/60"
            >
              Open source
            </Link>
          </div>
          <p className="mt-12 hidden font-mono text-xs text-mist lg:block">
            press <kbd className="rounded border border-line px-1.5 py-0.5">⌘K</kbd> to jump anywhere
          </p>
        </div>
      </section>

      {/* ── Venue marquee ─────────────────────────────────────── */}
      <section className="overflow-hidden border-y border-line py-5">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap font-mono text-sm text-mist">
          {[...venues, ...venues].map((v, i) => (
            <span key={i} className="flex items-center gap-12">
              <span>{v}</span>
              <span className="text-teal">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Three passions, <span className="grad-text">one through-line</span>
          </h2>
          <p className="mt-3 max-w-2xl text-mist">
            Every project: how do we make digital space feel visceral and alive?
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <Link href="/lab/unreal-visionos" className="glass block h-full rounded-2xl p-7">
              <p className="font-mono text-xs text-teal">01 / ENGINES</p>
              <h3 className="mt-3 text-xl font-bold">Unreal & Godot, let&apos;s go further than the documentation</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Engine-level fixes &amp; improvements for Vision Pro, Godot physics game at 90 fps on AVP,
                MetaHumans like you&apos;ve never seen them before. When a plugin says
                &quot;Experimental,&quot; the real fun begins.
              </p>
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/repos" className="glass block h-full rounded-2xl p-7">
              <p className="font-mono text-xs text-grape">02 / AI</p>
              <h3 className="mt-3 text-xl font-bold">Agents that ship real work. No tech for tech&apos;s sake.</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                A fleet of machines at Agile Lens running AI agents around the clock without breaking the bank. Field manuals so agents
                drive Unreal without crashing it. Pipelines where the overnight build greets you with a new
                TestFlight-approved app waiting on device by morning.
              </p>
            </Link>
          </Reveal>
          <Reveal delay={240}>
            <Link href="/about" className="glass block h-full rounded-2xl p-7">
              <p className="font-mono text-xs text-amber">03 / STAGES</p>
              <h3 className="mt-3 text-xl font-bold">Theatre is the original VR</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Live actors performing in headsets since 2018. Worked on Venice Biennale&apos;s first global
                live VR show, an annual Christmas Carol in VR, mixed reality theatre with an actor
                surrounded by digital assets, and published SIGGRAPH papers on all of it.
              </p>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Featured repos ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <Reveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Fresh from the repo</h2>
              <p className="mt-3 text-mist">Real tools built for Agile Lens, now available to you.</p>
            </div>
            <Link href="/repos" className="hidden font-mono text-sm text-teal hover:underline md:block">
              all repos →
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r, i) => (
            <Reveal key={r.slug} delay={i * 80}>
              <RepoCard repo={r} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Lab teaser ────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-grape">The Lab</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Here&apos;s <span className="grad-text">what&apos;s bubbling:</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 90}>
                <Link href={`/lab/${p.slug}`} className="glass block h-full rounded-2xl p-7">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{renderBreaks(p.tagline)}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
