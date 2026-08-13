// Everything /lab's constellation may draw from.
//
// SERVER ONLY, for the same reason as lib/heroLinkPool.ts: it imports
// lib/data.ts. app/lab/page.tsx already does, so this costs the page nothing
// extra, but it must not follow ParticleField into the browser bundle.
//
// Deliberately NOT the homepage's 416-link pool. That one is the whole site;
// this one is the room you are standing in — the products on this page, the
// repos they grew out of, and the handful of pages a Lab visitor actually
// wants next. A visitor who came here to read about Project Ion is not served
// by a dot pointing at a 2015 meetup talk.

import { repos, products } from "@/lib/data";
import { short, hostOf } from "@/lib/heroLinkPool";
import type { HeroLink } from "@/lib/heroLinks";

/** Where a Lab reader plausibly goes next. Teal, the same as the hero's. */
const LAB_PRIMARY: HeroLink[] = [
  { href: "/plugins", label: "Plugins", kicker: "What's already licensed", tier: "primary" },
  { href: "/repos", label: "Open Source", kicker: "Public repos & tools", tier: "primary" },
  { href: "/vote", label: "Vote", kicker: "Help pick what gets built", tier: "primary" },
  { href: "/support", label: "Support the Lab", kicker: "Keep the experiments running", tier: "primary" },
  { href: "/contact", label: "Contact", kicker: "Ask about any of these", tier: "primary" },
];

export function buildLabLinkPool(): HeroLink[] {
  const pool: HeroLink[] = [...LAB_PRIMARY];

  // The page's own cards, as dots. Every one of these has a briefing page.
  for (const p of products) {
    pool.push({
      href: `/lab/${p.slug}`,
      label: short(p.name),
      kicker: short(`In the Lab · ${p.status}`, 40),
      tier: "deep",
    });
    for (const l of p.links) {
      if (/^https?:\/\//.test(l.url)) {
        pool.push({
          href: l.url,
          label: short(l.label),
          kicker: short(`${p.name} · ${hostOf(l.url)}`, 40),
          tier: "external",
        });
      }
    }
  }

  for (const r of repos) {
    pool.push({
      href: `/repos/${r.slug}`,
      label: short(r.name),
      kicker: short(`${r.category} · open source`, 40),
      tier: "section",
    });
    if (r.github) {
      pool.push({
        href: r.github,
        label: short(r.name),
        kicker: short(`GitHub · ${hostOf(r.github)}`, 40),
        tier: "external",
      });
    }
  }

  // First writer wins, so a curated label beats a generated one — same rule
  // as buildHeroLinkPool().
  const seen = new Set<string>();
  return pool.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)));
}
