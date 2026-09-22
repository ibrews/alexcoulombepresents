import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import ParticleField from "@/components/ParticleField";
import WaitlistForm from "@/components/WaitlistForm";
import { products } from "@/lib/data";
import { buildLabLinkPool } from "@/lib/labLinkPool";
import { renderBreaks } from "@/components/Lines";

export const metadata: Metadata = {
  title: "The Lab: Upcoming XR Tools",
  description:
    "Upcoming products from Alex Coulombe: Forage (AI-first Fab asset scout), Project Ion (projection-mapping previz for Vision Pro), UnRealityKit Bridge, Pinchwork OpenXR hand tracking, and Apple Vision Pro + OpenXR engine work.",
  alternates: { canonical: "/lab" },
};

const accentText: Record<string, string> = {
  amber: "text-amber",
  purple: "text-grape",
  teal: "text-teal",
  blue: "text-sky",
};

export default function Lab() {
  const activeProducts = products.filter((product) => !product.internal && !product.experiment);
  const fieldNotes = products.filter((product) => product.experiment);
  const internalSystems = products.filter((product) => product.internal && !product.experiment);

  return (
    <div className="pb-24 pt-32">
      <Ethereal variant="nebula" />
      <section className="relative overflow-hidden">
        {/* No `opacity-50` on this wrapper any more: the constellation's link
            dots draw onto the same canvas as the ambient field, and halving
            them along with it made the one interactive thing here the dimmest
            thing here. The ambient dots keep their old strength via `dim`. */}
        <div className="absolute inset-0">
          <ParticleField density={0.00005} dim={0.5} pool={buildLabLinkPool()} />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-16">
          <Reveal>
            <p className="font-mono text-sm text-teal">/lab</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              The private repos are <span className="grad-text">getting restless.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              {activeProducts.length} products currently moving toward a release, pilot, or wider
              access — plus field notes from finished experiments and a peek at the internal systems
              behind the work. Each page says what exists today and what is still being tested.
            </p>
            <p className="mt-4 text-sm text-mist">
              Looking for what&apos;s already shipped?{" "}
              <Link href="/plugins" className="text-teal hover:underline">
                Licensed Unreal Engine plugins
              </Link>{" "}
              are live now.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-5" aria-labelledby="active-lab-work">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-teal">Current work</p>
              <h2 id="active-lab-work" className="mt-2 text-2xl font-bold tracking-tight">On the bench now</h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-mist">
              Betas, design-partner previews, and tools with a concrete next release step.
            </p>
          </div>
        </Reveal>
        {activeProducts.map((p, i) => (
          <Reveal key={p.slug} delay={i * 80}>
            <Link href={`/lab/${p.slug}`} className="glass group block rounded-3xl p-8 md:p-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-baseline gap-4">
                  <span className={`font-mono text-sm ${accentText[p.accent] ?? "text-teal"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-teal md:text-3xl">
                    {p.name}
                  </h2>
                </div>
                <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">
                  {p.status}
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-lg text-mist">{renderBreaks(p.tagline)}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {p.bullets.slice(0, 3).map((b) => (
                  <span key={b} className="rounded-full bg-line/50 px-3 py-1.5 text-xs text-mist">
                    {renderBreaks(b)}
                  </span>
                ))}
              </div>
              <p className="mt-6 font-mono text-sm text-teal opacity-0 transition-opacity group-hover:opacity-100">
                full briefing →
              </p>
            </Link>
          </Reveal>
        ))}
      </section>

      {fieldNotes.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl space-y-8 px-5" aria-labelledby="lab-field-notes">
          <Reveal>
            <div className="mb-8 border-b border-line pb-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber">Archive</p>
              <h2 id="lab-field-notes" className="mt-2 text-2xl font-bold tracking-tight">Field notes &amp; finished experiments</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
                Kept public because the build notes, captures, and mistakes are useful even after active development ends.
              </p>
            </div>
          </Reveal>
          {fieldNotes.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <Link href={`/lab/${p.slug}`} className="glass group block rounded-3xl p-8 md:p-12">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-baseline gap-4">
                    <span className={`font-mono text-sm ${accentText[p.accent] ?? "text-teal"}`}>A{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-2xl font-bold tracking-tight transition-colors group-hover:text-teal md:text-3xl">{p.name}</h3>
                  </div>
                  <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">{p.status}</span>
                </div>
                <p className="mt-4 max-w-3xl text-lg text-mist">{renderBreaks(p.tagline)}</p>
                <p className="mt-6 font-mono text-sm text-teal opacity-0 transition-opacity group-hover:opacity-100">read the field notes →</p>
              </Link>
            </Reveal>
          ))}
        </section>
      )}

      {internalSystems.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-5" aria-labelledby="internal-systems">
          <Reveal>
            <details className="group border-t border-line pt-8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                <span>
                  <span className="block font-mono text-xs uppercase tracking-[0.22em] text-mist">Behind the scenes</span>
                  <span id="internal-systems" className="mt-2 block text-xl font-bold">{internalSystems.length} internal systems</span>
                </span>
                <span className="font-mono text-sm text-teal group-open:rotate-45" aria-hidden="true">＋</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
                Production infrastructure shown for context. These are not public release promises or waitlist products.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {internalSystems.map((p) => (
                  <Link key={p.slug} href={`/lab/${p.slug}`} className="glass rounded-2xl p-6 transition-colors hover:border-teal/40">
                    <p className="font-bold">{p.name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{renderBreaks(p.tagline)}</p>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-mist">{p.status}</p>
                  </Link>
                ))}
              </div>
            </details>
          </Reveal>
        </section>
      )}

      <Reveal>
        <div className="mt-16 text-center">
          <p className="font-mono text-sm text-mist">Want early access to any of these?</p>
          <div className="mx-auto mt-4 max-w-md">
            <WaitlistForm
              list="lab"
              cta="Raise your hand →"
              successMessage="You'll hear first when any of these open up."
            />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
