import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Support the Lab — Alex Coulombe Presents";

export default function Image() {
  return new ImageResponse(
    ogImage({
      kicker: "/support",
      title: "Support the Lab.",
      accent: "support",
    }),
    { ...size }
  );
}
