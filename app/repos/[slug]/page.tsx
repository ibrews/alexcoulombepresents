import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import StarCount from "@/components/StarCount";
import { repos } from "@/lib/data";
import { renderBreaks, plainText } from "@/components/Lines";

export function generateStaticParams() {
  return repos.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const repo = repos.find((r) => r.slug === slug);
  if (!repo) return {};
  return {
    title: repo.name,
    description: plainText(repo.tagline),
    alternates: { canonical: `/repos/${repo.slug}` },
  };
}

export default async function RepoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const repo = repos.find((r) => r.slug === slug);
  if (!repo) notFound();

  const siblings = repos.filter((r) => r.category === repo.category && r.slug !== repo.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/repos" className="font-mono text-sm text-mist hover:text-teal">
          ← all repos
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{repo.name}</h1>
          <StarCount repo={repo.slug} fallback={repo.stars} />
        </div>
        <p className="mt-4 text-xl leading-relaxed text-mist">{renderBreaks(repo.tagline)}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={repo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            View on GitHub →
          </a>
          {repo.wiki && (
            <a
              href={repo.wiki}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
            >
              Living wiki / docs
            </a>
          )}
          {repo.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape/60"
            >
              {l.label}
            </a>
          ))}
          {repo.video && (
            <a
              href={`https://www.youtube.com/watch?v=${repo.video}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-amber/60"
            >
              ▶ Watch the demo
            </a>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="glass mt-12 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">The story</p>
          <p className="mt-4 leading-relaxed text-mist">{renderBreaks(repo.story)}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">Highlights</p>
          <ul className="mt-5 space-y-3">
            {repo.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-sm leading-relaxed text-mist">
                <span className="mt-0.5 text-teal">✦</span>
                <span>{renderBreaks(h)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-12 rounded-2xl border border-line p-6 font-mono text-sm text-mist">
          <span className="text-amber">$</span> git clone {repo.github}.git
        </div>
      </Reveal>

      {siblings.length > 0 && (
        <Reveal>
          <div className="mt-16">
            <p className="font-mono text-xs uppercase tracking-widest text-mist">
              More in {repo.category}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/repos/${s.slug}`} className="glass rounded-xl p-5">
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-mist">{renderBreaks(s.tagline)}</p>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
