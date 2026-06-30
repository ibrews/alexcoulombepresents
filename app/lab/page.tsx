import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import ParticleField from "@/components/ParticleField";
import WaitlistForm from "@/components/WaitlistForm";
import { products } from "@/lib/data";
import { renderBreaks } from "@/components/Lines";

export const metadata: Metadata = {
  title: "The Lab: Upcoming XR Tools",
  description:
    "Upcoming products from Alex Coulombe: Forage, UnRealityKit Bridge, Pinchwork universal OpenXR hand tracking, and Unreal Engine × visionOS engine work.",
  alternates: { canonical: "/lab" },
};

const accentText: Record<string, string> = {
  amber: "text-amber",
  purple: "text-grape",
  teal: "text-teal",
  blue: "text-sky",
};

export default function Lab() {
  return (
    <div className="pb-24 pt-32">
      <Ethereal variant="nebula" />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <ParticleField density={0.00005} />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-16">
          <Reveal>
            <p className="font-mono text-sm text-teal">/lab</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              The private repos are <span className="grad-text">getting restless.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              Four products in active development, all pointed at the same future: spatial computing
              where the engines, the assets, and the AI agents finally cooperate. Hardware-verified,
              demo-ready, and approaching the launch pad.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-5">
        {products.map((p, i) => (
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
