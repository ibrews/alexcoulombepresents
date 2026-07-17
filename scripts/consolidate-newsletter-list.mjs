#!/usr/bin/env node
/**
 * One-time (and safely re-runnable) consolidation: adds every email that has
 * ever signed up for ANY list to the generic "newsletter" list too, without
 * touching their original list memberships. After this runs,
 * `node scripts/broadcast.mjs --list newsletter` reaches everyone who has
 * signed up for anything on the site — the original per-list tags stay in
 * place for future tailored sends.
 *
 * Usage:
 *   node scripts/consolidate-newsletter-list.mjs            # do it
 *   node scripts/consolidate-newsletter-list.mjs --dry-run   # preview only
 *
 * Reads DATABASE_URL from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

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

async function main() {
  loadEnvLocal();
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const sql = neon(process.env.DATABASE_URL);

  const candidates = await sql`
    SELECT DISTINCT ON (email) email, name
    FROM signups
    WHERE list != 'newsletter'
    ORDER BY email, created_at ASC
  `;
  const already = await sql`SELECT email FROM signups WHERE list = 'newsletter'`;
  const alreadySet = new Set(already.map((r) => r.email));
  const toAdd = candidates.filter((r) => !alreadySet.has(r.email));

  console.log(`Total distinct emails across all lists: ${candidates.length}`);
  console.log(`Already on "newsletter": ${alreadySet.size}`);
  console.log(`Would add: ${toAdd.length}`);

  if (dryRun) {
    toAdd.forEach((r) => console.log(`  + ${r.email}`));
    console.log("\n[dry run] nothing written.");
    return;
  }
  if (toAdd.length === 0) {
    console.log("Nothing to do — everyone is already on the newsletter list.");
    return;
  }

  let added = 0;
  for (const r of toAdd) {
    await sql`
      INSERT INTO signups (email, name, list)
      VALUES (${r.email}, ${r.name}, 'newsletter')
      ON CONFLICT (email, list) DO NOTHING
    `;
    added++;
  }
  console.log(`Done. Added ${added} email(s) to "newsletter".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
