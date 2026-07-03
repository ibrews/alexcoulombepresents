import type { MetadataRoute } from "next";
import { repos, products, site } from "@/lib/data";

// Static + dynamic routes for search engines. Uses the canonical production
// domain (site.url) so it's correct once the domain is connected.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const top: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.9 },
    { path: "/training", priority: 0.9 },
    { path: "/repos", priority: 0.8 },
    { path: "/skills", priority: 0.8 },
    { path: "/videos", priority: 0.7 },
    { path: "/lab", priority: 0.8 },
    { path: "/store", priority: 0.7 },
    { path: "/links", priority: 0.5 },
  ];

  const staticEntries: MetadataRoute.Sitemap = top.map((t) => ({
    url: `${base}${t.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: t.priority,
  }));

  const repoEntries: MetadataRoute.Sitemap = repos.map((r) => ({
    url: `${base}/repos/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const devlogEntries: MetadataRoute.Sitemap = repos
    .filter((r) => r.devlog)
    .map((r) => ({
      url: `${base}${r.devlog!.url}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/lab/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...repoEntries, ...devlogEntries, ...productEntries];
}
