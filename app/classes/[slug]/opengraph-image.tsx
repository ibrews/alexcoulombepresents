import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";
import { classSessions, sessionBySlug } from "@/lib/classSessions";
import { instructorNames } from "@/lib/instructors";
import { newYorkParts } from "@/lib/sessionCalendar";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "A live class from Alex Coulombe Presents";

export function generateStaticParams() {
  return classSessions.map((s) => ({ slug: s.slug }));
}

// Unlike /training's card, these ARE dated on purpose: each class owns its
// URL, so the date can never outlive the session it names — and a date is
// the first thing someone scrolling a guest instructor's feed needs.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = sessionBySlug(slug);
  if (!s) {
    return new ImageResponse(ogImage({ kicker: "/classes", title: "Live Unreal classes", accent: "training" }), { ...size });
  }
  const { weekday, date, time, tz } = newYorkParts(s.startsISO);
  const kind = s.kind === "livestream" ? "Free livestream" : s.kind === "office-hours" ? "Office hours" : "Live class";
  return new ImageResponse(
    ogImage({
      kicker: `${kind} · ${weekday}, ${date} · ${time} ${tz}`,
      title: s.title,
      sub: `with ${instructorNames(s.instructorIds)}`,
      accent: "training",
    }),
    { ...size }
  );
}
