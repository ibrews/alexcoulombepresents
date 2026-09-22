import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import RepoCard from "@/components/RepoCard";
import CtaRow from "@/components/CtaRow";
import { repos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Open Source: Unreal, Godot & visionOS",
  description:
    "Public repositories from Alex Coulombe (@ibrews): Unreal Engine plugins, Godot on Apple Vision Pro, visionOS tools, AI agent skills, and developer utilities.",
  alternates: { canonical: "/repos" },
};

const categories = ["Games", "Unreal Engine", "Godot × Vision Pro", "visionOS & Spatial", "AI & Agents", "Tools"] as const;

const releaseLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default function Repos() {
  const spotlights = repos.filter((repo) => repo.spotlight && repo.lifecycle !== "archive");
  const currentRepos = repos.filter((repo) => repo.lifecycle !== "archive" && !repo.spotlight);
  const archivedRepos = repos.filter((repo) => repo.lifecycle === "archive");

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/repos</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Open source, <span className="grad-text">with the gotchas documented.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Every repo here exists because something was harder than it should have been. The fix got
          built, the scar tissue got written down, and both got published. Star counts are live from
          the GitHub API; each project page links to its living wiki on GitHub.
        </p>
      </Reveal>

      {spotlights.length > 0 && (
        <section className="mt-16" aria-labelledby="recent-releases">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber">Freshly published</p>
                <h2 id="recent-releases" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                  New tools, built from real production snags.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-mist">
                Small, sharp utilities with public source, working instructions, and the failure modes written down.
              </p>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spotlights.map((repo, index) => (
              <Reveal key={repo.slug} delay={Math.min(index * 70, 210)}>
                <article className="flex h-full flex-col">
                  {repo.released && (
                    <time
                      dateTime={repo.released}
                      className="mb-2 self-start rounded-full border border-amber/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber"
                    >
                      {releaseLabel.format(new Date(`${repo.released}T12:00:00Z`))}
                    </time>
                  )}
                  <div className="flex-1"><RepoCard repo={repo} /></div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {categories.map((cat) => {
        const list = currentRepos.filter((r) => r.category === cat);
        if (list.length === 0) return null;
        return (
          <div key={cat} className="mt-16">
            <Reveal>
              <h2 className="font-mono text-sm uppercase tracking-widest text-mist">
                <span className="text-teal">▸</span> {cat}
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((r, i) => (
                <Reveal key={r.slug} delay={Math.min(i * 70, 280)}>
                  <RepoCard repo={r} />
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}

      {archivedRepos.length > 0 && (
        <Reveal>
          <details className="group mt-20 border-t border-line pt-8">
            <summary className="group flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
              <span>
                <span className="block font-mono text-xs uppercase tracking-[0.22em] text-mist">Portfolio archive</span>
                <span className="mt-2 block text-xl font-bold">{archivedRepos.length} earlier experiments, still available</span>
              </span>
              <span className="font-mono text-sm text-teal group-open:rotate-45" aria-hidden="true">＋</span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist">
              Finished prototypes and one-off demos move here when they are no longer active work. Their write-ups and source links stay intact.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {archivedRepos.map((repo) => (
                <RepoCard key={repo.slug} repo={repo} />
              ))}
            </div>
          </details>
        </Reveal>
      )}

      <Reveal>
        <p className="mt-16 text-center font-mono text-sm text-mist">
          More on{" "}
          <a href="https://github.com/ibrews" className="text-teal hover:underline" target="_blank" rel="noopener noreferrer">
            github.com/ibrews
          </a>{" "}
          — including the forks, the experiments, and the hyper-targeted repos to solve absurdly specific problems.
        </p>
      </Reveal>

      <CtaRow
        heading="Like how these are built?"
        sub="Every one of these repos came out of real production work — the classes teach the same techniques, gotchas included."
      />
    </div>
  );
}
