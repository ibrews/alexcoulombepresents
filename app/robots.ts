import type { MetadataRoute } from "next";
import { site } from "@/lib/data";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/store/success", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
