// Assembles every destination the hero constellation may draw from.
//
// SERVER ONLY. This reaches the filesystem (newsletter + curriculum markdown)
// and imports lib/appearances.ts and lib/press.ts — well over a thousand lines
// of historical record that has no business in the browser bundle for a
// decorative hero. app/page.tsx calls this on the server and passes the result
// to FaceField; lib/heroLinks.ts is the client-safe half.
//
// The rule for inclusion is Alex's: if it's a link that shows up somewhere on
// the site, it's fair game. That is genuinely a lot — parsing the 70
// prerendered pages of a production build turns up 378 distinct hrefs, 284 of
// them off-site — so the deep and external tiers are built from the site's own
// content rather than a hand-picked shortlist, and the leftovers that live
// only in page JSX are generated into heroLinkPool.generated.ts by
// `npm run build && npm run gen:hero-links`.

import { repos, products, epicCourses } from "@/lib/data";
import { appearances } from "@/lib/appearances";
import { pressMentions } from "@/lib/press";
import { venues } from "@/lib/venues";
import { getNewsletterIssues } from "@/lib/newsletters";
import { getCurriculumEntries } from "@/lib/curriculum";
import { generatedHeroLinks } from "@/lib/heroLinkPool.generated";
import type { HeroLink } from "@/lib/heroLinks";

// The seven that live in the top nav (components/Nav.tsx).
const PRIMARY: HeroLink[] = [
  { href: "/about", label: "About", kicker: "Architect turned XR-chitect", tier: "primary" },
  { href: "/training", label: "Training", kicker: "Live Unreal & AI classes", tier: "primary" },
  { href: "/repos", label: "Open Source", kicker: "Public repos & tools", tier: "primary" },
  { href: "/lab", label: "The Lab", kicker: "What's still cooking", tier: "primary" },
  { href: "/appearances", label: "Appearances", kicker: "Talks, panels, festivals", tier: "primary" },
  { href: "/store", label: "Store", kicker: "Courses, assets, downloads", tier: "primary" },
  { href: "/contact", label: "Contact", kicker: "Say hello", tier: "primary" },
];

// Real sections that lost their nav slot in 5c19fd2, plus the rest of the
// site's own top-level pages. All of these are linked from the footer or a
// page body — none is orphaned.
const SECTION: HeroLink[] = [
  { href: "/skills", label: "AI Skills", kicker: "Agent skills you can install", tier: "section" },
  { href: "/videos", label: "Videos", kicker: "YouTube & recorded sessions", tier: "section" },
  { href: "/plugins", label: "Plugins", kicker: "Licensed Unreal plugins", tier: "section" },
  { href: "/links", label: "Links", kicker: "Everywhere else I am", tier: "section" },
  { href: "/newsletter", label: "Newsletter", kicker: "Monthly dispatch", tier: "section" },
  { href: "/support", label: "Support the Lab", kicker: "Keep the experiments running", tier: "section" },
  { href: "/curriculum", label: "Curriculum", kicker: "The full class catalog", tier: "section" },
  { href: "/book", label: "Book a session", kicker: "Office hours & consults", tier: "section" },
  { href: "/training#teams", label: "Team training", kicker: "Bring your whole studio", tier: "section" },
  { href: "/members", label: "Membership", kicker: "Class credits & recordings", tier: "section" },
  { href: "/vote", label: "Vote", kicker: "Help pick what gets built", tier: "section" },
  { href: "/feedback", label: "Feedback", kicker: "Tell me what's missing", tier: "section" },
];

/**
 * Trim a title to something a tooltip can hold without turning into a
 * paragraph. Cuts on a word boundary so it never reads as a truncation bug.
 */
export function short(text: string, max = 44): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** Where an off-site link actually goes, for the tooltip's second line. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "elsewhere";
  }
}

/**
 * The half modelled from the site's data modules.
 *
 * Kept separate from the generated half on purpose: scripts/gen-hero-links.mjs
 * computes "rendered on the site but not already covered" and must subtract
 * only THIS. Subtracting the combined pool would make the generator erase its
 * own output on the second run.
 */
export function buildCuratedPool(): HeroLink[] {
  const deep: HeroLink[] = [];
  const external: HeroLink[] = [];

  const addExternal = (url: string | undefined, label: string, context: string) => {
    if (!url || !/^https?:\/\//.test(url)) return;
    external.push({ href: url, label: short(label), kicker: short(`${context} · ${hostOf(url)}`, 40), tier: "external" });
  };

  for (const r of repos) {
    deep.push({
      href: `/repos/${r.slug}`,
      label: short(r.name),
      kicker: short(`${r.category} · open source`, 40),
      tier: "deep",
    });
    // A devlog is its own page on this site when the href is internal.
    if (r.devlog?.url?.startsWith("/")) {
      deep.push({
        href: r.devlog.url,
        label: short(`${r.name} devlog`),
        kicker: "Build log",
        tier: "deep",
      });
    }
    addExternal(r.github, r.name, "GitHub");
    addExternal(r.wiki, `${r.name} wiki`, "Wiki");
    for (const l of r.links) addExternal(l.url, l.label, r.name);
  }

  for (const p of products) {
    deep.push({
      href: `/lab/${p.slug}`,
      label: short(p.name),
      kicker: short(`In the Lab · ${p.status}`, 40),
      tier: "deep",
    });
    for (const l of p.links) addExternal(l.url, l.label, p.name);
  }

  // Every talk, panel and guest lecture on /appearances. These have no page of
  // their own, so they deep-link to their card's anchor (the `id={a.slug}` on
  // components/AppearancesSection.tsx's Card) rather than throwing the visitor
  // straight off-site — the card itself carries the outbound link.
  for (const a of appearances) {
    deep.push({
      href: `/appearances#${a.slug}`,
      label: short(a.title),
      kicker: short(`${a.org} · ${a.date}`, 40),
      tier: "deep",
    });
  }

  for (const p of pressMentions) {
    addExternal(p.url, p.title, p.outlet);
  }

  for (const c of epicCourses) {
    addExternal(c.href, c.name, `Epic ${c.kind}`);
  }

  for (const v of venues) {
    addExternal(v.url, v.name, "Venue");
  }

  for (const issue of getNewsletterIssues()) {
    deep.push({
      href: `/newsletter/${issue.slug}`,
      label: short(issue.title),
      kicker: "Newsletter issue",
      tier: "deep",
    });
  }

  for (const entry of getCurriculumEntries()) {
    deep.push({
      href: `/curriculum/${entry.slug}`,
      label: short(entry.title),
      kicker: short(`Class · ${entry.level}`, 40),
      tier: "deep",
    });
  }

  return [...PRIMARY, ...SECTION, ...deep, ...external];
}

/**
 * Everything the constellation may draw from: the modelled half plus the
 * links that only exist in page JSX. Curated entries come first so their
 * hand-written labels win over a generated one for the same destination.
 */
export function buildHeroLinkPool(): HeroLink[] {
  const seen = new Set<string>();
  return [...buildCuratedPool(), ...generatedHeroLinks].filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
}
