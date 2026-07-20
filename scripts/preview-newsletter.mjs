#!/usr/bin/env node
/**
 * Preview a newsletter issue exactly as it will be emailed — same renderer
 * scripts/broadcast.mjs uses — with zero credentials, zero deployment.
 * Writes a local HTML file and opens it in your default browser.
 *
 * Usage:
 *   node scripts/preview-newsletter.mjs                                  # latest issue
 *   node scripts/preview-newsletter.mjs 2026-07-16-siggraph-and-august-cohort
 *
 * Images referenced as /newsletter/foo.jpg are inlined straight from
 * public/newsletter/ on disk (as data: URIs) if the file's there — so a
 * just-uploaded image previews correctly immediately, with no deploy
 * needed. The REAL send (scripts/broadcast.mjs) always uses the actual
 * https://alexcoulombepresents.com URL, which only works once you've
 * committed & pushed the image file — this preview is just showing you
 * what the picture will look like ahead of that.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNewsletterEmail } from "../lib/newsletterEmail.ts";
import { LIST_REASON } from "../lib/lists.ts";

// Resolved from this file's own location, NOT process.cwd() — works no
// matter what directory you run it from.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIR = path.join(ROOT, "content", "newsletters");

function loadIssue(slug) {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  const file = slug ? `${slug}.md` : files.sort().reverse()[0];
  if (!files.includes(file)) {
    console.error(`No such issue: ${file}\nAvailable: ${files.join(", ")}`);
    process.exit(1);
  }
  const raw = readFileSync(path.join(DIR, file), "utf8");
  const [header, ...rest] = raw.split(/^---$/m);
  const get = (key) => header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
  return { slug: file.replace(/\.md$/, ""), title: get("title"), body: rest.join("---").trim() };
}

const IMAGE_DIR = path.join(ROOT, "public", "newsletter");
const CONTENT_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };

// Swap <img src="https://.../newsletter/foo.jpg"> for a data: URI when
// foo.jpg exists locally — so preview never depends on deploy status.
function inlineLocalImages(html) {
  return html.replace(/src="[^"]*\/newsletter\/([^"?]+)"/g, (match, filename) => {
    const filePath = path.join(IMAGE_DIR, decodeURIComponent(filename));
    if (!filePath.startsWith(IMAGE_DIR) || !existsSync(filePath)) return match;
    const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    const data = readFileSync(filePath).toString("base64");
    return `src="data:${type};base64,${data}"`;
  });
}

const issue = loadIssue(process.argv[2]);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

// A realistic footer using the same "newsletter" list/reason a real
// consolidated send would use — not a live link (fake token), just enough
// to see exactly where it sits and how it reads.
const footerHtml = `You&rsquo;re receiving this newsletter because ${LIST_REASON.newsletter}. Future newsletters will be more tailored to the specific list you signed up for. <a href="#" style="color:#888">To unsubscribe from this list, click here.</a>`;

const html = inlineLocalImages(renderNewsletterEmail({ bodyMarkdown: issue.body, footerHtml, siteUrl }));
const outPath = path.join(ROOT, `.newsletter-preview-${issue.slug}.html`);
writeFileSync(outPath, html);
console.log(`Preview written: ${outPath}`);

try {
  execSync(`open "${outPath}"`);
  console.log("Opened in your default browser.");
} catch {
  console.log("Couldn't auto-open — open the file above manually.");
}
