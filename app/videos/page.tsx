import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import LiteVideo from "@/components/LiteVideo";
import { featuredVideo, videos, playlists } from "@/lib/data";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Key videos and playlists from Alex Coulombe's YouTube channel — Vision Pro experiments, Unreal Engine talks, Godot pioneering, AI agent builds, and live VR theatre.",
  alternates: { canonical: "/videos" },
};

const tags = ["Vision Pro", "Unreal", "Godot", "AI", "Theatre", "Talks"] as const;

const tagColor: Record<string, string> = {
  "Vision Pro": "text-grape",
  Unreal: "text-sky",
  Godot: "text-teal",
  AI: "text-amber",
  Theatre: "text-rose-400",
  Talks: "text-mist",
};

export default function Videos() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/videos</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          The build log, <span className="grad-text">on camera.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Six hundred-plus videos of experiments, talks, and tutorials on{" "}
          <a
            href="https://youtube.com/@ibrews"
            target="_blank"
            rel="noopener noreferrer"
            className="text-snow underline decoration-teal/50 hover:decoration-teal"
          >
            youtube.com/@ibrews
          </a>
          . Here&apos;s the curated path in — most of these pair with a repo or Lab project on this
          site.
        </p>
      </Reveal>

      {/* Featured */}
      <Reveal>
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
          <LiteVideo id={featuredVideo.id} title={featuredVideo.title} />
          <div>
            <p className={`font-mono text-xs uppercase tracking-widest ${tagColor[featuredVideo.tag]}`}>
              Featured · {featuredVideo.tag}
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">{featuredVideo.title}</h2>
            <p className="mt-3 leading-relaxed text-mist">{featuredVideo.blurb}</p>
          </div>
        </div>
      </Reveal>

      {/* Grid by tag */}
      {tags.map((tag) => {
        const list = videos.filter((v) => v.tag === tag);
        if (list.length === 0) return null;
        return (
          <div key={tag} className="mt-16">
            <Reveal>
              <h2 className="font-mono text-sm uppercase tracking-widest text-mist">
                <span className={tagColor[tag]}>▸</span> {tag}
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((v, i) => (
                <Reveal key={v.id} delay={Math.min(i * 70, 210)}>
                  <div>
                    <LiteVideo id={v.id} title={v.title} />
                    {v.blurb && <p className="mt-2 px-1 text-xs leading-relaxed text-mist">{v.blurb}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}

      {/* Playlists */}
      <div className="mt-20">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight">Playlists for binging</h2>
          <p className="mt-3 text-mist">Pre-curated rabbit holes, straight from the channel.</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {playlists.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 60, 240)}>
              <a
                href={`https://www.youtube.com/playlist?list=${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex h-full flex-col rounded-2xl p-5"
              >
                <span className="font-mono text-xs text-teal">≡ playlist</span>
                <h3 className="mt-2 font-bold leading-snug group-hover:text-teal">{p.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{p.blurb}</p>
                <span className="mt-3 font-mono text-xs text-mist opacity-0 transition-opacity group-hover:opacity-100">
                  watch on YouTube →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <div className="mt-16 text-center">
          <a
            href="https://youtube.com/@ibrews?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            Subscribe on YouTube →
          </a>
          <p className="mt-3 font-mono text-xs text-mist">600+ videos and counting. The algorithm fears him.</p>
        </div>
      </Reveal>
    </div>
  );
}
