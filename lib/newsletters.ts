// ── Newsletter archive ───────────────────────────────────────────────────────
//
// Every issue sent to the list is archived here for the website. One markdown
// file per issue in content/newsletters/, named YYYY-MM-DD-slug.md, with a
// simple header block:
//
//   title: Live Unreal classes are back
//   date: 2026-07-16
//   subject: the exact email subject line
//   ---
//   body in markdown…
//
// Workflow: write the issue here FIRST, send it via Resend (scripts/
// broadcast.mjs or a Resend Broadcast) using the same body, and it's archived
// on /newsletter automatically at the next deploy. No separate CMS.
//
// Images: drop the file in public/newsletter/ and reference it as
// ![caption](/newsletter/filename.jpg) — works on the site immediately (no
// deploy needed in dev) and lib/newsletterEmail.ts auto-absolutizes the path
// to a real https:// URL when the issue is actually emailed, so the same
// markdown works in both places. A full https:// image URL (e.g. one
// already hosted elsewhere) works too, unchanged.
//
// Preview exactly what an issue will look like AS AN EMAIL (images and all)
// before sending anything — no credentials, nothing deployed:
//   node scripts/preview-newsletter.mjs [slug]
// (omit slug for the latest issue). Opens a local HTML file in your default
// browser. See scripts/preview-newsletter.mjs.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type NewsletterIssue = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  subject: string;
  body: string; // markdown
};

const DIR = path.join(process.cwd(), "content", "newsletters");

export function getNewsletterIssues(): NewsletterIssue[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const raw = readFileSync(path.join(DIR, file), "utf8");
      const [header, ...rest] = raw.split(/^---$/m);
      const get = (key: string) =>
        header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
      return {
        slug: file.replace(/\.md$/, ""),
        title: get("title"),
        date: get("date"),
        subject: get("subject") || get("title"),
        body: rest.join("---").trim(),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getNewsletterIssue(slug: string): NewsletterIssue | undefined {
  return getNewsletterIssues().find((i) => i.slug === slug);
}
