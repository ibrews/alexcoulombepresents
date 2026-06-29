import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import { agentSkills } from "@/lib/data";
import { renderBreaks } from "@/components/Lines";

export const metadata: Metadata = {
  title: "AI Skills for Claude Code",
  description:
    "Claude Code skills by Alex Coulombe — UE5 and iOS TestFlight pipelines live on Capafy, plus free open-source skills for Unreal MCP and Apple platforms.",
  alternates: { canonical: "/skills" },
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  live: { label: "Live on Capafy", cls: "border-teal/60 text-teal" },
  "coming-soon": { label: "Coming soon", cls: "border-amber/60 text-amber" },
  free: { label: "Free & open source", cls: "border-grape/60 text-grape" },
};

export default function Skills() {
  const live = agentSkills.filter((s) => s.status === "live");
  const soon = agentSkills.filter((s) => s.status === "coming-soon");
  const free = agentSkills.filter((s) => s.status === "free");

  const Section = ({ title, sub, list }: { title: string; sub: string; list: typeof agentSkills }) => (
    <div className="mt-16">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-2 text-mist">{sub}</p>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {list.map((s, i) => {
          const badge = statusBadge[s.status];
          return (
            <Reveal key={s.name} delay={Math.min(i * 80, 240)}>
              <div className="glass flex h-full flex-col rounded-2xl p-7">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-mono font-bold">{s.name}</h3>
                  <span className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed">{renderBreaks(s.blurb)}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{renderBreaks(s.detail)}</p>
                {s.link && (
                  <a
                    href={s.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 self-start font-mono text-sm text-teal hover:underline"
                  >
                    {s.link.label} →
                  </a>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/skills</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Teach your AI what took Alex <span className="grad-text">over a decade to learn.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Skills are install-once knowledge packs for Claude Code: every gotcha, crash pattern, and
          production workflow documented so your agent doesn&apos;t rediscover them at your expense.
          Built from real shipped apps — the same pipelines that put Unreal and Godot builds on
          TestFlight overnight. Premium skills live on{" "}
          <a
            href="https://capafy.ai/publisher/alex-coulombe-presents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-snow underline decoration-teal/50 hover:decoration-teal"
          >
            Capafy
          </a>
          ; the open-source ones are a <code className="rounded bg-line px-1.5 py-0.5 font-mono text-sm">npx skills add</code> away.
        </p>
      </Reveal>

      <Section title="Live now" sub="Purchasable today — they run in your own Claude, on your machine." list={live} />
      <Section title="In the pipeline" sub="Authored, tested, and queued for release. Watch this space." list={soon} />
      <Section title="Free forever" sub="Open source on GitHub — because the ecosystem rises together." list={free} />

      <Reveal>
        <div className="glass mt-16 rounded-3xl p-8 text-center md:p-10">
          <h2 className="text-xl font-bold">Want a skill that doesn&apos;t exist yet?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-mist">
            Custom skills for your team&apos;s engine, pipeline, or platform — built from the same
            battle-tested template.
          </p>
          <a
            href="mailto:info@alexcoulombepresents.com?subject=Custom%20AI%20Skill"
            className="mt-6 inline-block rounded-full bg-snow px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            Commission one →
          </a>
        </div>
      </Reveal>
    </div>
  );
}
