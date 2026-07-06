import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import RepoCard from "@/components/RepoCard";
import { repos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Open Source: Unreal, Godot & visionOS",
  description:
    "Public repositories from Alex Coulombe (@ibrews): Unreal Engine plugins, Godot on Apple Vision Pro, visionOS tools, AI agent skills, and developer utilities.",
  alternates: { canonical: "/repos" },
};

const categories = ["Games", "Unreal Engine", "Godot × Vision Pro", "visionOS & Spatial", "AI & Agents", "Tools"] as const;

export default function Repos() {
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

      {categories.map((cat) => {
        const list = repos.filter((r) => r.category === cat);
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

      <Reveal>
        <p className="mt-16 text-center font-mono text-sm text-mist">
          More on{" "}
          <a href="https://github.com/ibrews" className="text-teal hover:underline" target="_blank" rel="noopener noreferrer">
            github.com/ibrews
          </a>{" "}
          — including the forks, the experiments, and the hyper-targeted repos to solve absurdly specific problems.
        </p>
      </Reveal>
    </div>
  );
}
