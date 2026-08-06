import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import { PLUGIN_UPDATES } from "@/lib/commerce/pluginUpdates";
import type { PluginProduct } from "@/lib/commerce/pluginLicensing";

export const metadata: Metadata = {
  title: "Unreal Engine Plugins — Licensing",
  description:
    "Five Unreal Engine plugins Alex builds and ships: SceneAudit, URMBridge, Forage, Blueprint Auto Layout, and URKPreviewer. Educational and commercial licensing.",
  alternates: { canonical: "/plugins" },
};

// Version numbers come straight from PLUGIN_UPDATES — the same constant that
// backs the public GET /api/plugins/updates version-check endpoint plugins
// poll at runtime. One source of truth; this page can never drift from what
// a licensed plugin actually sees when it checks in. Revalidate on the same
// cadence as that route so a version bump shows up here without a redeploy.
export const revalidate = 300;

type PluginEntry = {
  product: PluginProduct;
  displayName: string;
  pitch: string;
  oss?: { label: string; url: string };
};

const PLUGINS: PluginEntry[] = [
  {
    product: "SceneAudit",
    displayName: "SceneAudit",
    pitch:
      "Numeric verdicts on 3D placement in Unreal — because the viewport is not a measuring instrument. Catches floating and misplaced objects a screenshot can't.",
  },
  {
    product: "URMBridge",
    displayName: "URMBridge",
    pitch: "Export an Unreal level to Pixar RenderMan. One menu click, no manual re-authoring.",
  },
  {
    product: "Forage",
    displayName: "Forage",
    pitch: "Search and install your own Fab asset library from a CLI or right inside the editor.",
  },
  {
    product: "BPAutoLayout",
    displayName: "Blueprint Auto Layout",
    pitch: "Rearranges any Blueprint graph into a clean, readable left-to-right execution flow.",
    oss: { label: "Free & open source on GitHub", url: "https://github.com/ibrews/blueprint-auto-layout" },
  },
  {
    product: "URKPreviewer",
    displayName: "URKPreviewer (UnRealityKit Live Link)",
    pitch: "Live-streams an Unreal scene straight into Apple RealityKit and visionOS — no export round-trip.",
  },
];

function mailtoFor(displayName: string, tier: "Educational" | "Commercial"): string {
  const subject = encodeURIComponent(`${displayName} — ${tier} licensing`);
  const body = encodeURIComponent(
    `Hi Alex,\n\nI'd like to license ${displayName} (${tier} tier). Here's a bit about my use case:\n\n`
  );
  return `mailto:info@alexcoulombepresents.com?subject=${subject}&body=${body}`;
}

export default function Plugins() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/plugins</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Unreal Engine plugins, <span className="grad-text">built from real production work.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Five tools that came out of actually shipping things in Unreal, not a roadmap exercise.
          Each is licensed for educational and commercial use — reach out and Alex will get you
          set up.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
          Licensed copies include update-check notifications, so you know the moment a new version
          ships. Signed download links are on the way — not live yet, so delivery is handled
          directly by Alex for now.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {PLUGINS.map((p, i) => {
          const info = PLUGIN_UPDATES[p.product];
          return (
            <Reveal key={p.product} delay={Math.min(i * 70, 280)}>
              <div className="glass flex h-full flex-col rounded-2xl p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-bold leading-snug">{p.displayName}</h2>
                  <span className="shrink-0 rounded-full border border-teal/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                    UE {info.min_ue}+
                  </span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-mist">{p.pitch}</p>
                <p className="mt-3 font-mono text-xs text-mist">
                  v{info.latest} · released {info.released}
                </p>
                {p.oss && (
                  <p className="mt-2 text-xs leading-relaxed text-mist">
                    Also available as{" "}
                    <a
                      href={p.oss.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-grape hover:underline"
                    >
                      {p.oss.label}
                    </a>{" "}
                    — this licensing tier is for the maintained, supported distribution.
                  </p>
                )}

                <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
                      Educational
                    </p>
                    <p className="mt-1 text-sm text-snow">Contact for pricing</p>
                    <a
                      href={mailtoFor(p.displayName, "Educational")}
                      className="mt-3 inline-block rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-teal/60 hover:text-snow"
                    >
                      Inquire →
                    </a>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
                      Commercial
                    </p>
                    <p className="mt-1 text-sm text-snow">Contact for pricing</p>
                    <a
                      href={mailtoFor(p.displayName, "Commercial")}
                      className="mt-3 inline-block rounded-full border border-line px-4 py-2 text-xs font-semibold transition-colors hover:border-amber/60 hover:text-snow"
                    >
                      Inquire →
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <h2 className="text-xl font-bold">Not sure which tier you need?</h2>
          <div className="mt-5 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-2">
            <p>
              <span className="text-snow">Educational.</span> For students, classrooms, and
              individual learning use — not for shipping a commercial product or a paid client
              engagement.
            </p>
            <p>
              <span className="text-snow">Commercial.</span> For studio, team, and client work —
              anything tied to a commercial project or product.
            </p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-mist">
            Not sure, or need a team seat count? Email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>{" "}
            or use the{" "}
            <a className="text-teal hover:underline" href="/contact">
              contact form
            </a>{" "}
            — Alex answers these directly.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
