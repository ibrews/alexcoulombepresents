import Link from "next/link";
import Reveal from "@/components/Reveal";

async function fetchLatestVideo() {
  try {
    const res = await fetch(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC8MAPAKCmBgidSv1MnzOMOw",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const videoId = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = xml.match(/<media:title>([^<]+)<\/media:title>/)?.[1];
    return videoId ? { videoId, title: title ?? "Latest video" } : null;
  } catch {
    return null;
  }
}

export default async function LatestVideo() {
  const video = await fetchLatestVideo();
  if (!video) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <Reveal>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal">YouTube</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Latest from the channel
            </h2>
          </div>
          <Link href="/videos" className="hidden font-mono text-sm text-teal hover:underline md:block">
            all videos →
          </Link>
        </div>
      </Reveal>
      <Reveal>
        <div
          className="glass mt-8 overflow-hidden rounded-2xl"
          style={{ aspectRatio: "16 / 9" }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="h-full w-full border-0"
          />
        </div>
      </Reveal>
    </section>
  );
}
