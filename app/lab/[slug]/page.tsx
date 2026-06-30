import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import WaitlistForm from "@/components/WaitlistForm";
import { products } from "@/lib/data";
import { renderBreaks, plainText } from "@/components/Lines";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: product.name,
    description: plainText(product.tagline),
    alternates: { canonical: `/lab/${product.slug}` },
  };
}

const accentText: Record<string, string> = {
  amber: "text-amber",
  purple: "text-grape",
  teal: "text-teal",
  blue: "text-sky",
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const accent = accentText[product.accent] ?? "text-teal";
  const others = products.filter((p) => p.slug !== product.slug);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/lab" className="font-mono text-sm text-mist hover:text-teal">
          ← the lab
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{product.name}</h1>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">
            {product.status}
          </span>
        </div>
        <p className={`mt-5 text-xl leading-relaxed md:text-2xl ${accent}`}>{renderBreaks(product.tagline)}</p>
      </Reveal>

      <Reveal>
        <p className="mt-8 text-lg leading-relaxed text-mist">{renderBreaks(product.pitch)}</p>
      </Reveal>

      <div className="mt-12 space-y-6">
        {product.sections.map((s, i) => (
          <Reveal key={s.heading} delay={i * 80}>
            <div className="glass rounded-3xl p-8">
              <h2 className="text-lg font-bold">{s.heading}</h2>
              <p className="mt-3 leading-relaxed text-mist">{renderBreaks(s.body)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-12">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">At a glance</p>
          <ul className="mt-5 space-y-3">
            {product.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed text-mist">
                <span className={`mt-0.5 ${accent}`}>✦</span>
                <span>{renderBreaks(b)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 text-center md:p-10">
          <h2 className="text-xl font-bold">Want in early?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-mist">
            {product.name} is in active development. Early-access spots, pilot projects, and
            collaborations are all on the table.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <WaitlistForm
              list={product.slug}
              cta="Join the waitlist →"
              successTitle="You're on the list."
              successMessage={`We'll email you the moment ${product.name} opens up.`}
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {product.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-6 py-3 text-sm font-semibold transition-colors hover:border-teal/60"
              >
                {l.label}
              </a>
            ))}
            {product.video && (
              <a
                href={`https://www.youtube.com/watch?v=${product.video}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-6 py-3 text-sm font-semibold transition-colors hover:border-amber/60"
              >
                ▶ See it running
              </a>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-16">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">Also in the lab</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} href={`/lab/${o.slug}`} className="glass rounded-xl p-5">
                <p className="text-sm font-bold">{o.name}</p>
                <p className="mt-1.5 line-clamp-2 text-xs text-mist">{renderBreaks(o.tagline)}</p>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
