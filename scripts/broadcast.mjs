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
 * --body      required. Path to a file with the email body (HTML or plain text).
 * --dry-run   optional. Print the recipient count + addresses, send nothing.
 *
 * Reads DATABASE_URL and RESEND_API_KEY from the environment or .env.local.
 * Each recipient gets their own individual email (no shared To/CC).
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

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
  const dryRun = process.argv.includes("--dry-run");

  if (!list || !subject || !bodyPath) {
    console.error("Usage: node scripts/broadcast.mjs --list <slug> --subject <text> --body <file> [--dry-run]");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

  const raw = readFileSync(bodyPath, "utf8");
  const isHtml = bodyPath.endsWith(".html") || /<[a-z][\s\S]*>/i.test(raw);

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

  // Resend batch endpoint accepts up to 100 messages per call.
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const batch = chunk.map((to) => ({
      from,
      to,
      subject,
      ...(isHtml ? { html: raw } : { text: raw }),
    }));
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
