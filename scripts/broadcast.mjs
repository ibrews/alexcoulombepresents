#!/usr/bin/env node
/**
 * Email everyone on a signup list, via Resend.
 *
 * Usage:
 *   node scripts/broadcast.mjs --list forage --subject "Forage is live!" --body email.html
 *   node scripts/broadcast.mjs --list ai --subject "AI cohort 1" --body note.txt --dry-run
 *
 * --list      required. One of the slugs in lib/lists.ts (forage, ai, unreal, …).
 * --subject   required. Email subject line.
 * --body      required. Path to a file with the email body. A .md file is
 *             converted through lib/newsletterEmail.ts (images, headings,
 *             links, bullets all render properly — this is the SAME
 *             converter the preview route uses, so what you preview is what
 *             gets sent) and sent as HTML with the raw markdown as the
 *             plain-text fallback. A .html file is sent as-is. Anything else
 *             is sent as plain text, verbatim.
 * --reason    optional. Override the "why you're receiving this" line —
 *             defaults to lib/lists.ts's LIST_REASON for --list.
 * --broad     optional. Adds a line noting future sends will be more
 *             tailored to the specific list someone's on. Use this for a
 *             send going to the consolidated "newsletter" list that mixes
 *             everyone together (its own content should say so too).
 * --dry-run   optional. Print the recipient count + addresses, send nothing.
 *
 * Reads DATABASE_URL, RESEND_API_KEY, and AUTH_SECRET from the environment
 * or .env.local. Each recipient gets their own individual email (no shared
 * To/CC), and every email automatically gets a footer explaining why they're
 * on the list plus a one-click unsubscribe link (+ List-Unsubscribe header)
 * — don't add your own reason/unsubscribe text, both are appended.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { LIST_REASON, isListSlug } from "../lib/lists.ts";
import { markdownToEmailHtml } from "../lib/newsletterEmail.ts";

// Mirrors lib/unsubscribe.ts's HMAC scheme exactly (kept inline since this is
// a plain .mjs script, not run through the Next.js/TS pipeline). A stale link
// mailed months ago must still verify, so it's deterministic — nothing to
// expire, nothing to look up.
function unsubscribeUrl(email, site) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const token = crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
  return `${site}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

function loadEnvLocal() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on real env */
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadEnvLocal();
  const list = arg("list");
  const subject = arg("subject");
  const bodyPath = arg("body");
  const reason = arg("reason") ?? (isListSlug(list) ? LIST_REASON[list] : undefined);
  const broad = process.argv.includes("--broad");
  const dryRun = process.argv.includes("--dry-run");

  if (!list || !subject || !bodyPath) {
    console.error("Usage: node scripts/broadcast.mjs --list <slug> --subject <text> --body <file> [--reason <text>] [--broad] [--dry-run]");
    process.exit(1);
  }
  if (!reason) {
    console.error(`No reason text for list "${list}" — add it to LIST_REASON in lib/lists.ts or pass --reason "..."`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set (needed for unsubscribe links)");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const raw = readFileSync(bodyPath, "utf8");
  const isMarkdown = bodyPath.endsWith(".md");
  const isHtml = isMarkdown || bodyPath.endsWith(".html") || /<[a-z][\s\S]*>/i.test(raw);
  // .md source → real content HTML (images, headings, links) via the same
  // renderer the preview route uses. Plain-text fallback is the raw markdown
  // itself — not pretty, but every line is still readable as text.
  const contentHtml = isMarkdown ? markdownToEmailHtml(raw, site) : raw;

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT email FROM signups WHERE list = ${list} ORDER BY created_at`;
  const emails = [...new Set(rows.map((r) => r.email))];

  console.log(`List "${list}": ${emails.length} recipient(s).`);
  if (dryRun) {
    emails.forEach((e) => console.log("  " + e));
    console.log("\n[dry run] nothing sent.");
    return;
  }
  if (emails.length === 0) {
    console.log("No recipients — nothing to send.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = "Alex Coulombe Presents <noreply@alexcoulombepresents.com>";
  let sent = 0;

  const tailoringNote = broad
    ? " Future newsletters will be more tailored to the specific list you signed up for."
    : "";

  // Resend batch endpoint accepts up to 100 messages per call. Every message
  // gets its OWN unsubscribe link (the token is per-email) plus a
  // List-Unsubscribe header so Gmail/Outlook show a native one-click button
  // next to the sender — not just a footer link someone has to find.
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const batch = chunk.map((to) => {
      const unsubUrl = unsubscribeUrl(to, site);
      const footerText = `You're receiving this newsletter because ${reason}.${tailoringNote} To unsubscribe from this list, click here: ${unsubUrl}`;
      const footerHtml = `You&rsquo;re receiving this newsletter because ${reason}.${tailoringNote} <a href="${unsubUrl}" style="color:#888">To unsubscribe from this list, click here.</a>`;
      const htmlBody = `${contentHtml}\n<hr style="margin-top:32px;border:none;border-top:1px solid #333"><p style="color:#888;font-size:12px;font-family:monospace">${footerHtml}</p>`;
      const textBody = `${raw}\n\n---\n${footerText}`;
      return {
        from,
        to,
        subject,
        ...(isHtml ? { html: htmlBody, text: textBody } : { text: textBody }),
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });
    const { error } = await resend.batch.send(batch);
    if (error) {
      console.error(`Batch ${i / 100 + 1} failed:`, error);
    } else {
      sent += chunk.length;
      console.log(`  sent ${sent}/${emails.length}`);
    }
  }
  console.log(`Done. ${sent} email(s) sent for "${list}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
