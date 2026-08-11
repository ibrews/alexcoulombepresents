import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import StarCount from "@/components/StarCount";
import LiteVideo from "@/components/LiteVideo";
import NativeVideo from "@/components/NativeVideo";
import VideoUpdates from "@/components/VideoUpdates";
import WikiContent from "@/components/WikiContent";
import CtaRow from "@/components/CtaRow";
import SpaceSavedTally from "@/components/SpaceSavedTally";
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
          <StarCount repo={repo.slug} org={repo.org} fallback={repo.stars} />
        </div>
        <p className="mt-4 text-xl leading-relaxed text-mist">{renderBreaks(repo.tagline)}</p>
        {repo.spaceSavedTally && <SpaceSavedTally />}

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={repo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            View on GitHub →
          </a>
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
        </div>
      </Reveal>

      {repo.devlog && (
        <Reveal>
          <Link
            href={repo.devlog.url}
            className="glass mt-12 flex flex-col gap-3 rounded-3xl p-8 transition-transform hover:scale-[1.01] md:flex-row md:items-center md:justify-between md:p-10"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-amber">Devlog</p>
              <p className="mt-3 max-w-2xl leading-relaxed text-mist">{repo.devlog.teaser}</p>
            </div>
            <span className="font-mono text-sm whitespace-nowrap text-teal">Read the devlog →</span>
          </Link>
        </Reveal>
      )}

      {repo.video && (
        <Reveal>
          <div className="mt-12">
            <LiteVideo id={repo.video} title={repo.name} />
            {repo.videos && repo.videos.length > 0 && (
              <VideoUpdates videos={repo.videos} />
            )}
          </div>
        </Reveal>
      )}

      {!repo.video && repo.nativeVideo && (
        <Reveal>
          <div className="mt-12">
            <NativeVideo src={repo.nativeVideo.src} poster={repo.nativeVideo.poster} title={repo.name} />
          </div>
        </Reveal>
      )}

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

      {repo.wiki && <WikiContent githubUrl={repo.github} />}

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

      <CtaRow
        heading="Want this level of depth on your own project?"
        sub="The classes teach the same production techniques these repos are built with — scar tissue included."
      />
    </div>
  );
}
