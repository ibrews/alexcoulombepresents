"use client";

import { useState } from "react";

const loops = [
  { slug: "pinch-menu", title: "Your hands are the interface.", description: "Hold both pinches to open settings. Point, pinch, choose." },
  { slug: "grab-place", title: "Pick it up. Make it count.", description: "Carry a physics prop onto its pad and watch the lesson complete." },
  { slug: "reset-ball", title: "Retry without guessing.", description: "Lift the coral reset ball, then release it to reset that exhibit." },
  { slug: "door-response", title: "A small action opens a door.", description: "Place the cube on its pad. Reset the lesson and the door closes." },
  { slug: "power-workshop", title: "Bring the workshop to life.", description: "Power cells, an opening door, and a machine that answers your actions." },
];

function Loop({ slug, title, description }: typeof loops[number]) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-panel/40">
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        aria-pressed={playing}
        aria-label={`${playing ? "Pause" : "Play"} GIF: ${title}`}
        className="group relative block w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
      >
        {/* GIF bytes load only on request; still posters also respect reduced-motion preferences. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/lab/uoxr/loops/${slug}.${playing ? "gif" : "jpg"}`}
          alt={title}
          width={768}
          height={488}
          loading="lazy"
          className="block h-auto w-full"
        />
        <span className="absolute right-3 top-3 rounded-full bg-ink/90 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-teal">
          {playing ? "Pause loop" : "Play GIF"}
        </span>
      </button>
      <figcaption className="p-5">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">{description}</p>
        <a href={`/lab/uoxr/loops/${slug}.gif`} download className="mt-4 inline-block text-xs font-semibold text-teal underline underline-offset-4">Download GIF →</a>
      </figcaption>
    </figure>
  );
}

export default function UoxrSimulatorLoops() {
  return (
    <section id="simulator-gifs" className="mt-14" aria-labelledby="uoxr-loops-title">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">Real interactions / little loops</p>
      <h2 id="uoxr-loops-title" className="mt-3 text-3xl font-bold tracking-tight">See the input become action.</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-mist">Five moments from actual simulator runs. Play a loop, pause on its still, or grab the GIF to share.</p>
      <div className="mt-7 grid gap-5 lg:grid-cols-3">{loops.map((loop) => <Loop key={loop.slug} {...loop} />)}</div>
    </section>
  );
}
