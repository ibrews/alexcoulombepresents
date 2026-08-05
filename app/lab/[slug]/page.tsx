import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import WaitlistForm from "@/components/WaitlistForm";
import LiteVideo from "@/components/LiteVideo";
import VideoUpdates from "@/components/VideoUpdates";
import { products } from "@/lib/data";
import { isListSlug } from "@/lib/lists";
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

      {product.guide && (
        <Reveal>
          <Link
            href={product.guide.href}
            className={`mt-8 inline-flex rounded-full border border-current px-5 py-3 text-sm font-semibold transition-colors hover:bg-teal hover:text-ink ${accent}`}
          >
            {product.guide.label} →
          </Link>
        </Reveal>
      )}

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

      {product.video && (
        <Reveal>
          <div className="mt-14">
            <LiteVideo id={product.video} title={product.name} />
            {product.videos && product.videos.length > 0 && (
              <VideoUpdates videos={product.videos} />
            )}
          </div>
        </Reveal>
      )}

      {product.screenshots && product.screenshots.length > 0 && (
        <Reveal>
          <div className="mt-14">
            <p className="font-mono text-xs uppercase tracking-widest text-mist">See it in use</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {product.screenshots.map((s) => (
                <figure key={s.src} className="overflow-hidden rounded-2xl border border-line">
                  <Image
                    src={s.src}
                    alt={s.alt}
                    width={1440}
                    height={900}
                    unoptimized
                    className="w-full"
                  />
                  <figcaption className="p-4 text-xs leading-relaxed text-mist">{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div id="waitlist" className="glass mt-8 scroll-mt-24 rounded-3xl p-8 text-center md:p-10">
          {product.internal ? (
            <>
              <h2 className="text-xl font-bold">This one&apos;s internal.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-mist">
                {product.name} is Agile Lens tooling with no public release planned — it&apos;s here
                because it powers the client work. Curious what it powers?{" "}
                <a
                  href="https://agilelens.com/portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:underline"
                >
                  Browse the Agile Lens portfolio
                </a>{" "}
                or{" "}
                <Link href="/contact" className="text-teal hover:underline">
                  get in touch
                </Link>{" "}
                about custom work.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Want in early?</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-mist">
                {product.name} is in active development. Early-access spots, pilot projects, and
                collaborations are all on the table.
              </p>
              <div className="mx-auto mt-6 max-w-md">
                <WaitlistForm
                  list={isListSlug(product.slug) ? product.slug : "lab"}
                  context={isListSlug(product.slug) ? undefined : product.name}
                  cta="Join the waitlist →"
                  successTitle="You're on the list."
                  successMessage={`We'll email you the moment ${product.name} opens up.`}
                />
              </div>
            </>
          )}
          {product.links.length > 0 && (
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
            </div>
          )}
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
