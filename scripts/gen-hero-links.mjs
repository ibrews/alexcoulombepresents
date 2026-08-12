// Regenerates the half of the hero constellation's link pool that can only be
// discovered by looking at the real site.
//
// lib/heroLinkPool.ts models the site's links from its data modules, which is
// fast and gives clean labels — but plenty of links exist only in page JSX
// (Capafy listings, the Discord invite, Epic credentials, Agile Lens), and a
// model of the site drifts from the site. So this parses every anchor out of
// the pages a production build prerenders, subtracts what the curated pool
// already has, and writes the remainder to lib/heroLinkPool.generated.ts.
//
//   npm run build && npm run gen:hero-links
//
// Committed output, same as scripts/gen-content.mjs. Re-run it whenever pages
// gain or lose links; the diff shows exactly what moved.

import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

// lib/* uses the `@/…` path alias from tsconfig, which only Next understands.
// Teach plain Node the same mapping so the real pool builder can be imported
// here rather than reimplemented (a second copy would drift from the first,
// which is exactly the failure this audit exists to catch).
const ROOT = pathToFileURL(`${process.cwd()}/`).href;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      // TS-style extensionless imports. Test for a REAL module extension, not
      // just a dot — "heroLinkPool.generated" has a dot and is still a .ts file.
      const rel = specifier.slice(2);
      const hasExt = /\.(ts|tsx|js|mjs|cjs|json)$/.test(rel);
      return next(ROOT + (hasExt ? rel : `${rel}.ts`), context);
    }
    return next(specifier, context);
  },
});

const BUILD_DIR = ".next/server/app";

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`No build output at ${BUILD_DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

// Anchor text comes out of prerendered HTML, so it is entity-encoded. Numeric
// escapes matter here: React emits &#x27; for every apostrophe, and "Author&#x27;s
// Guide" is not a label anyone wants in a tooltip.
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–" };
function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => NAMED[name.toLowerCase()] ?? " ");
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) htmlFiles.push(full);
  }
})(BUILD_DIR);

/** href -> the first anchor text seen for it, for a readable report. */
const rendered = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/<a\b[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = m[1];
    const text = decodeEntities(m[2].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    if (!rendered.has(href)) rendered.set(href, text);
  }
}

// Curated-only: see the note on buildCuratedPool. Using the combined pool
// here would make this script blank its own output on the second run.
// A dev server rewrites .next and leaves almost no prerendered HTML behind, so
// running this after `npm run dev` finds nothing, concludes nothing is missing,
// and blanks the generated file. Refuse rather than quietly destroy it.
const MIN_PAGES = 20;
const MIN_HREFS = 100;
if (htmlFiles.length < MIN_PAGES || rendered.size < MIN_HREFS) {
  console.error(
    `Refusing to write: only ${htmlFiles.length} page(s) and ${rendered.size} href(s) found in ${BUILD_DIR}.\n` +
      `That is a stale or dev-server build. Run \`npm run build\` (not \`npm run dev\`) first.`
  );
  process.exit(1);
}

const { buildCuratedPool } = await import("../lib/heroLinkPool.ts");
const { appearances } = await import("../lib/appearances.ts");
const APPEARANCE_URLS = new Set(appearances.map((a) => a.url).filter(Boolean));
const pool = buildCuratedPool();
const pooled = new Set(pool.map((l) => l.href));

const byTier = pool.reduce((acc, l) => ({ ...acc, [l.tier]: (acc[l.tier] ?? 0) + 1 }), {});

// Links the site renders that the constellation would never offer. Anchors and
// query strings normalize to their page, since that is the destination.
const ASSET = /\.(jpg|jpeg|png|webp|gif|svg|zip|pdf|mp4|ics)$/i;
const skip = (href) =>
  !/^(\/|https?:)/.test(href) || // mailto:, tel:, javascript:
  href.startsWith("/api/") ||
  href === "#" ||
  href === "/" ||
  ASSET.test(href) ||
  // Every talk on /appearances is in the pool as an internal anchor to its
  // card (/appearances#slug); the card's own outbound link is deliberately
  // not a second pool entry for the same thing.
  APPEARANCE_URLS.has(href) ||
  // The site linking to its own production domain is the same page twice.
  href.startsWith("https://alexcoulombepresents.com");

const missing = [...rendered.entries()]
  .filter(([href]) => !skip(href))
  .filter(([href]) => !pooled.has(href) && !pooled.has(href.split("#")[0]))
  .sort();

// ── Tier the leftovers by shape ─────────────────────────────────────────
const EXT = /^https?:\/\//;
function tierFor(href) {
  if (EXT.test(href)) return "external";
  const depth = href.split("#")[0].split("/").filter(Boolean).length;
  return depth <= 1 ? "section" : "deep";
}

function fromUrlTail(href) {
  const tail = href.split("#")[0].replace(/\/$/, "").split("/").filter(Boolean).pop() ?? href;
  // A UUID or hash tail (Epic credential URLs, asset digests) makes a label
  // like "ae75c735 f7c6 4fc5 a633 f400ec2efd4b". The host is more use.
  if (/^[0-9a-f]{8,}(-[0-9a-f]{4,}){0,4}$/i.test(tail) || !/[aeiou]/i.test(tail)) {
    try {
      return short(new URL(href).hostname.replace(/^www\./, ""));
    } catch {
      /* fall through to the tail */
    }
  }
  return short(tail.replace(/[-_]/g, " "));
}

function cleanLabel(text, href) {
  const stripped = text
    .replace(/[→↗←≡“”"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // A link whose visible text is just its own URL, or a pull-quote used as a
  // link, makes a poor tooltip. Name those from the URL instead.
  if (stripped && !/^https?:\/\//.test(stripped) && !stripped.startsWith("@")) return short(stripped);
  if (stripped) return fromUrlTail(href);
  // No anchor text at all (an icon link, an image link).
  return fromUrlTail(href);
}

function short(text, max = 44) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

function kickerFor(href) {
  if (EXT.test(href)) {
    try {
      return new URL(href).hostname.replace(/^www\./, "");
    } catch {
      return "elsewhere";
    }
  }
  return `On this site · ${href.split("#")[0]}`;
}

const generated = missing.map(([href, text]) => ({
  href,
  label: cleanLabel(text, href),
  kicker: short(kickerFor(href), 40),
  tier: tierFor(href),
}));

const OUT = "lib/heroLinkPool.generated.ts";
fs.writeFileSync(
  OUT,
  `// GENERATED by scripts/audit-hero-links.mjs — do not edit by hand.\n` +
    `//\n` +
    `// Links that render somewhere on the site but are not reachable from the\n` +
    `// data modules lib/heroLinkPool.ts reads (they live in page JSX). Labels are\n` +
    `// the anchor text the site itself shows. Regenerate with:\n` +
    `//\n` +
    `//   npm run build && npm run gen:hero-links\n` +
    `\n` +
    `import type { HeroLink } from "@/lib/heroLinks";\n\n` +
    `export const generatedHeroLinks: HeroLink[] = ${JSON.stringify(generated, null, 2)};\n`
);

console.log(`pages parsed        ${htmlFiles.length}`);
console.log(`rendered hrefs      ${rendered.size}`);
console.log(`pool size           ${pool.length}`);
console.log(`  by tier           ${JSON.stringify(byTier)}`);
console.log(`covered             ${rendered.size - missing.length - [...rendered.keys()].filter(skip).length}`);
console.log(`skipped (mailto/…)  ${[...rendered.keys()].filter(skip).length}`);
console.log(`not in pool         ${missing.length}`);

const genTiers = generated.reduce((acc, l) => ({ ...acc, [l.tier]: (acc[l.tier] ?? 0) + 1 }), {});
console.log(`\nwrote ${OUT}: ${generated.length} links ${JSON.stringify(genTiers)}`);
console.log(`combined pool       ${pool.length + generated.length}`);
