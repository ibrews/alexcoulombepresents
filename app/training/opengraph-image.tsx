import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Unreal Engine Training — Alex Coulombe Presents";

export default function Image() {
  return new ImageResponse(
    ogImage({
      kicker: "/training",
      title: "Learn Unreal from someone who ships with it every day.",
      sub: "Live classes · Next cohort Aug 5 — Epic Games Authorized Instructor",
      accent: "training",
    }),
    { ...size }
  );
}
