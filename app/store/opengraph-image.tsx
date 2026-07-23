import { ImageResponse } from "next/og";
import { ogImage, ogSize, ogContentType } from "@/lib/ogTemplate";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Work With Alex — Courses, Skills & Templates";

export default function Image() {
  return new ImageResponse(
    ogImage({
      kicker: "/store",
      title: "Classes, vouchers & tools.",
      sub: "$50 founding voucher · any group class",
      accent: "store",
    }),
    { ...size }
  );
}
