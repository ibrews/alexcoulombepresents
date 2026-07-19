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
 * Images referenced as /newsletter/foo.jpg resolve against
 * NEXT_PUBLIC_SITE_URL (or the real production domain if unset) — exactly
 * what a recipient's inbox will load, so this only shows real images once
 * they're actually deployed. Run `npm run dev` and pass
 * NEXT_PUBLIC_SITE_URL=http://localhost:3000 first if you want to preview
 * an image you haven't deployed yet.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { renderNewsletterEmail } from "../lib/newsletterEmail.ts";
import { LIST_REASON } from "../lib/lists.ts";

const DIR = path.join(process.cwd(), "content", "newsletters");

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

const issue = loadIssue(process.argv[2]);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

// A realistic footer using the same "newsletter" list/reason a real
// consolidated send would use — not a live link (fake token), just enough
// to see exactly where it sits and how it reads.
const footerHtml = `You&rsquo;re receiving this newsletter because ${LIST_REASON.newsletter}. Future newsletters will be more tailored to the specific list you signed up for. <a href="#" style="color:#888">To unsubscribe from this list, click here.</a>`;

const html = renderNewsletterEmail({ bodyMarkdown: issue.body, footerHtml, siteUrl });
const outPath = path.join(process.cwd(), `.newsletter-preview-${issue.slug}.html`);
writeFileSync(outPath, html);
console.log(`Preview written: ${outPath}`);

try {
  execSync(`open "${outPath}"`);
  console.log("Opened in your default browser.");
} catch {
  console.log("Couldn't auto-open — open the file above manually.");
}
