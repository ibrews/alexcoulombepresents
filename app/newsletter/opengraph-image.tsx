import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";
import { getNewsletterIssues } from "@/lib/newsletters";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Alex Coulombe Presents · Newsletter";

export default function Image() {
  const latest = getNewsletterIssues()[0];

  return new ImageResponse(
    ogImage({
      kicker: "/newsletter",
      title: "The Newsletter — every issue archived.",
      sub: latest ? `Latest: ${latest.title}` : undefined,
      accent: "newsletter",
    }),
    { ...size }
  );
}
