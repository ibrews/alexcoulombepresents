"use client";

import { useEffect, useRef, useState } from "react";

// Self-hosted trailer (public/trailers/<slug>.mp4). Two modes:
// - click-to-play (default): only the poster loads until someone hits play,
//   then the video plays with sound and native controls.
// - ambient: muted autoplay loop for a hero slot, with a sound toggle.
//   Browsers only allow autoplay when muted, so sound is opt-in.
export default function TrailerVideo({
  slug,
  title,
  ambient = false,
  className = "",
}: {
  slug: string;
  title: string;
  ambient?: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  // React doesn't render `muted` as an HTML attribute, so the browser sees an
  // unmuted autoplay and refuses it. Set it on the element, then start it; if
  // the browser still says no (low-power mode, data saver), show the poster.
  useEffect(() => {
    const v = ref.current;
    if (!ambient || !v) return;
    v.muted = true;
    v.play().catch(() => setAutoplayBlocked(true));
  }, [ambient]);
  const src = `/trailers/${slug}.mp4`;
  const poster = `/trailers/${slug}.jpg`;
  const frame = `relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-ink ${className}`;

  if (ambient) {
    return (
      <div className={frame}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="metadata"
          controls={!muted}
          aria-label={title}
          className="h-full w-full object-cover"
        />
        {autoplayBlocked && muted && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {muted && (
          <button
            onClick={() => {
              setMuted(false);
              setAutoplayBlocked(false);
              const v = ref.current;
              if (v) {
                v.currentTime = 0;
                v.muted = false;
                void v.play();
              }
            }}
            className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-ink/75 px-4 py-2 font-mono text-xs font-semibold text-snow backdrop-blur transition-colors hover:bg-teal hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch with sound
          </button>
        )}
      </div>
    );
  }

  if (playing) {
    return (
      <div className={frame}>
        <video src={src} poster={poster} autoPlay controls playsInline aria-label={title} className="h-full w-full" />
      </div>
    );
  }

  return (
    <button onClick={() => setPlaying(true)} className={`group block text-left ${frame}`} aria-label={`Play: ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 backdrop-blur transition-all group-hover:scale-110 group-hover:bg-teal/90">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1 text-snow group-hover:text-ink" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
