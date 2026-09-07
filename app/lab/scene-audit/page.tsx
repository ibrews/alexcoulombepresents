import type { Metadata } from "next";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";
import SceneAuditIllustration from "@/components/SceneAuditIllustration";
import { products } from "@/lib/data";

const product = products.find((p) => p.slug === "scene-audit")!;

export const metadata: Metadata = {
  title: product.name,
  description: "SceneAudit measures surface-conforming 3D placement in Unreal Engine with signed offsets, correction vectors, and orthographic views. Explore the workflow and licensing.",
  alternates: { canonical: "/lab/scene-audit" },
};

export default function SceneAuditPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/lab" className="font-mono text-sm text-mist hover:text-teal">← the lab</Link>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{product.name}</h1>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">{product.status}</span>
        </div>
        <p className="mt-5 text-2xl leading-relaxed text-teal md:text-3xl">{product.tagline}</p>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mist">{product.pitch}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/plugins" className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-snow">Licensing and access →</Link>
          <a href="#workflow" className="rounded-full border border-line px-6 py-3 text-sm font-semibold hover:border-teal/60">Explore the workflow ↓</a>
        </div>
      </Reveal>

      <SceneAuditIllustration />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {product.bullets.map((bullet) => (
          <p key={bullet} className="rounded-2xl border border-line px-5 py-4 text-sm leading-relaxed text-mist"><span className="mr-2 text-teal" aria-hidden="true">✦</span>{bullet}</p>
        ))}
      </div>

      <section id="workflow" aria-label="SceneAudit workflow and scope" className="mt-12 scroll-mt-28 space-y-6">
        {product.sections.map((section, i) => (
          <Reveal key={section.heading}>
            <div className="glass rounded-3xl p-6 md:p-8">
              <p className="font-mono text-xs text-teal">0{i + 1}</p>
              <h2 className="mt-3 text-xl font-bold">{section.heading}</h2>
              <p className="mt-3 leading-relaxed text-mist">{section.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <aside className="mt-8 rounded-3xl border border-line p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">Research in progress</p>
          <h2 className="mt-3 text-xl font-bold">Beyond placement: lighting and color</h2>
          <p className="mt-3 leading-relaxed text-mist">SceneAudit also has experimental tools for comparing render lighting and eye color. That work remains research-grade and is separate from the placement workflow described here. For a broader look at reviewing rendered footage, explore <Link href="/lab/video-qa-workbench" className="text-teal underline underline-offset-4">Video QA Workbench</Link>.</p>
        </aside>
      </Reveal>

      <Reveal>
        <section className="glass mt-12 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">Alex Coulombe Presents</p>
          <h2 className="mt-3 text-2xl font-bold">Bring a scene. Get a measured answer.</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-mist">Educational and commercial access is handled directly by Alex. Share your use case and Unreal Engine version to discuss licensing and delivery. There is no public download on this page.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="mailto:info@alexcoulombepresents.com?subject=SceneAudit%20access" className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-ink hover:bg-snow">Ask about SceneAudit →</a>
            {product.links.map((link) => <Link key={link.url} href={link.url} className="rounded-full border border-line px-6 py-3 text-sm font-semibold hover:border-teal/60">{link.label} →</Link>)}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <div className="mt-12">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">Related work</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {products.filter((p) => ["fabel-showcase", "video-qa-workbench"].includes(p.slug)).map((related) => (
              <Link key={related.slug} href={`/lab/${related.slug}`} className="glass rounded-2xl p-6 transition-colors hover:border-teal/60">
                <h2 className="font-bold">{related.name} →</h2>
                <p className="mt-3 text-sm leading-relaxed text-mist">{related.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
