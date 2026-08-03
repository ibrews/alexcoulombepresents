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
      // Deliberately undated: this image is cached hard by every social
      // platform that has ever scraped it, so a specific date here outlives
      // the class it names.
      sub: "Live classes every Wednesday — Epic Games Authorized Instructor",
      accent: "training",
    }),
    { ...size }
  );
}
