import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";

type DevlogImage = {
  kind: "image";
  src: string;
  reducedMotionPoster?: string;
  alt: string;
  label: string;
  caption: string;
};

type DevlogVideo = {
  kind: "video";
  src: string;
  poster?: string;
  label: string;
  caption: string;
  title: string;
};

export type DevlogMedia = DevlogImage | DevlogVideo;

export type DevlogEntry = {
  date: string;
  title: string;
  status: "failed review" | "correction underway" | "accepted offline" | "planned" | "next test";
  body: string;
  media?: DevlogMedia[];
  notes?: string[];
};

const statusStyle: Record<DevlogEntry["status"], string> = {
  "failed review": "border-rose-300/30 bg-rose-300/10 text-rose-200",
  "correction underway": "border-amber/30 bg-amber/10 text-amber",
  "accepted offline": "border-teal/30 bg-teal/10 text-teal",
  planned: "border-teal/30 bg-teal/10 text-teal",
  "next test": "border-sky/30 bg-sky/10 text-sky",
};

export default function SpatialLabDevlog({
  productName,
  eyebrow,
  title,
  intro,
  entries,
  nextMedia,
}: {
  productName: string;
  eyebrow: string;
  title: string;
  intro: string;
  entries: DevlogEntry[];
  nextMedia: string[];
}) {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href={`/lab/${productName.toLowerCase().replaceAll(" ", "-")}`} className="font-mono text-sm text-mist hover:text-teal">
          ← {productName}
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-teal">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mist">{intro}</p>
        <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-mist">
          <span className="rounded-full border border-line px-3 py-1.5">Render ≠ headset capture</span>
          <span className="rounded-full border border-line px-3 py-1.5">Planned ≠ integrated</span>
          <span className="rounded-full border border-line px-3 py-1.5">Failures stay visible</span>
        </div>
      </Reveal>

      <div className="relative mt-16 space-y-8 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-px before:bg-line md:before:left-[19px]">
        {entries.map((entry, index) => (
          <Reveal key={`${entry.date}-${entry.title}`} delay={index * 70}>
            <article className="relative pl-9 md:pl-14">
              <span aria-hidden="true" className="absolute left-1 top-6 h-4 w-4 rounded-full border-4 border-ink bg-teal md:left-3" />
              <div className="glass rounded-3xl p-6 md:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <time className="font-mono text-xs uppercase tracking-widest text-mist">{entry.date}</time>
                  <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusStyle[entry.status]}`}>
                    {entry.status}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">{entry.title}</h2>
                <p className="mt-4 max-w-3xl leading-relaxed text-mist">{entry.body}</p>
                {entry.media && (
                  <div className={`mt-7 grid gap-5 ${entry.media.length > 1 ? "md:grid-cols-2" : ""}`}>
                    {entry.media.map((item) => (
                      <figure key={item.src} className="overflow-hidden rounded-2xl border border-line bg-ink/40">
                        <div className="relative aspect-[4/3] bg-panel">
                          {item.kind === "image" ? (
                            <>
                              <Image
                                src={item.src}
                                alt={item.alt}
                                fill
                                sizes="(min-width: 768px) 45vw, 100vw"
                                className={`object-contain ${item.reducedMotionPoster ? "motion-reduce:hidden" : ""}`}
                                unoptimized={item.src.endsWith(".gif")}
                              />
                              {item.reducedMotionPoster && (
                                <Image
                                  src={item.reducedMotionPoster}
                                  alt={`${item.alt} Static neutral frame.`}
                                  fill
                                  sizes="(min-width: 768px) 45vw, 100vw"
                                  className="hidden object-contain motion-reduce:block"
                                />
                              )}
                            </>
                          ) : (
                            <video
                              src={item.src}
                              poster={item.poster}
                              title={item.title}
                              controls
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-contain"
                            >
                              Your browser does not support embedded video.
                            </video>
                          )}
                          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-ink/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-snow">
                            {item.label}
                          </span>
                        </div>
                        <figcaption className="p-4 text-sm leading-relaxed text-mist">{item.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                {entry.notes && (
                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {entry.notes.map((note) => (
                      <li key={note} className="rounded-xl border border-line bg-ink/30 px-4 py-3 text-sm leading-relaxed text-mist">
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <section className="mt-12 rounded-3xl border border-dashed border-line p-6 md:p-9" aria-labelledby="media-roadmap">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">Media roadmap</p>
          <h2 id="media-roadmap" className="mt-3 text-2xl font-bold">What will appear here next</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist">
            These are publication slots, not stand-in art. Each one will be added only when the named capture exists, with its source and test state attached.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {nextMedia.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-xl bg-panel/40 p-4 text-sm text-mist">
                <span className="font-mono text-teal">{String(index + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>
    </main>
  );
}
