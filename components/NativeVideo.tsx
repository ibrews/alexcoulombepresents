"use client";

import { useState } from "react";

// Same click-to-load pattern as LiteVideo, but for a self-hosted mp4 (no
// YouTube dependency) — the <video> tag loads nothing until the user hits
// play, matching LiteVideo's zero-JS-on-load behavior.
export default function NativeVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line">
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-line text-left"
      aria-label={`Play: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        loading="lazy"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 backdrop-blur transition-all group-hover:scale-110 group-hover:bg-teal/90">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-snow group-hover:text-ink">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="absolute bottom-4 left-4 right-4 text-sm font-bold drop-shadow">{title}</span>
    </button>
  );
}
