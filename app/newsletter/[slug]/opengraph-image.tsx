import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";
import { getNewsletterIssue, getNewsletterIssues } from "@/lib/newsletters";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Alex Coulombe Presents · Newsletter";

export function generateStaticParams() {
  return getNewsletterIssues().map((i) => ({ slug: i.slug }));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const issue = getNewsletterIssue(params.slug);

  return new ImageResponse(
    ogImage({
      kicker: "Alex Coulombe Presents · Newsletter",
      title: issue?.title ?? "Newsletter",
      sub: issue?.date,
      accent: "newsletter",
    }),
    { ...size }
  );
}
