#!/usr/bin/env node
/**
 * One-time import of the old "Interested in learning UE?" Google Form
 * responses (~441 rows: Name, Email, "What Would You Like to Learn?").
 * Inserts each row into BOTH the "legacy-interest" list (preserves
 * provenance — these people never saw this new site) and the "newsletter"
 * list (per Alex, 2026-07-16: safe to include them in the consolidated send).
 *
 * Usage:
 *   node scripts/import-legacy-signups.mjs responses.csv            # do it
 *   node scripts/import-legacy-signups.mjs responses.csv --dry-run   # preview
 *
 * Expects a CSV with a header row containing at least "Name" and "Email"
 * columns (case-insensitive; a "What Would You Like to Learn?" column, if
 * present, is stored as the signup's message). Extra columns are ignored.
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

// Minimal CSV parser — handles quoted fields with embedded commas/newlines.
// Good enough for a Google Forms/Sheets export; not a general-purpose parser.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

async function main() {
  loadEnvLocal();
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!csvPath || csvPath.startsWith("--")) {
    console.error("Usage: node scripts/import-legacy-signups.mjs <responses.csv> [--dry-run]");
    process.exit(1);
  }
  if (!dryRun && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const raw = readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.findIndex((h) => h === "name");
  const emailIdx = header.findIndex((h) => h === "email");
  const messageIdx = header.findIndex((h) => h.includes("learn"));
  if (emailIdx === -1) throw new Error(`No "Email" column found. Header was: ${rows[0].join(", ")}`);

  const seen = new Set();
  const people = [];
  for (const r of rows.slice(1)) {
    const email = (r[emailIdx] || "").trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    people.push({
      name: nameIdx !== -1 ? (r[nameIdx] || "").trim() || null : null,
      email,
      message: messageIdx !== -1 ? (r[messageIdx] || "").trim() || null : null,
    });
  }

  console.log(`Parsed ${rows.length - 1} row(s), ${people.length} unique valid email(s).`);
  if (dryRun) {
    people.slice(0, 10).forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    if (people.length > 10) console.log(`  ... and ${people.length - 10} more`);
    console.log("\n[dry run] nothing written.");
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  let inserted = 0;
  for (const p of people) {
    await sql`
      INSERT INTO signups (email, name, message, list)
      VALUES (${p.email}, ${p.name}, ${p.message}, 'legacy-interest')
      ON CONFLICT (email, list) DO NOTHING
    `;
    await sql`
      INSERT INTO signups (email, name, list)
      VALUES (${p.email}, ${p.name}, 'newsletter')
      ON CONFLICT (email, list) DO NOTHING
    `;
    inserted++;
  }
  console.log(`Done. Imported ${inserted} legacy contact(s) into "legacy-interest" and "newsletter".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
