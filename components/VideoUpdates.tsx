"use client";
import { useState } from "react";

function UpdateCard({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div>
      <div className="overflow-hidden rounded-xl">
        {playing ? (
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={title}
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative block w-full"
            aria-label={`Play: ${title}`}
          >
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt={title}
              className="aspect-video w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/20 transition-transform group-hover:scale-110">
                <span className="ml-0.5 text-white">▶</span>
              </div>
            </div>
          </button>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-snug text-mist">{title}</p>
    </div>
  );
}

export default function VideoUpdates({
  videos,
}: {
  videos: { id: string; title: string }[];
}) {
  if (!videos.length) return null;
  return (
    <div className="mt-8">
      <p className="font-mono text-xs uppercase tracking-widest text-mist">
        Updates · {videos.length} {videos.length === 1 ? "video" : "videos"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {videos.map((v) => (
          <UpdateCard key={v.id} id={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
}
