#!/usr/bin/env node
/**
 * Import a Zoom registrant CSV (as produced by
 * ~/knowledge/scripts/zoom/fetch_registrants.py) into a signups list, so it
 * can be sent to via scripts/broadcast.mjs like any other list — same
 * unsubscribe links, tracking, and attribution footer.
 *
 * Usage:
 *   node scripts/import-zoom-registrants.mjs registrants.csv --list aug5-free-class
 *   node scripts/import-zoom-registrants.mjs registrants.csv --list aug5-free-class --dry-run
 *
 * Expects the fetch_registrants.py CSV shape: email, first_name, last_name,
 * status, create_time. Only status=approved rows are imported by default
 * (people who actually completed registration) — pass --status all to
 * import everyone regardless of status.
 *
 * --list must be a slug already defined in lib/lists.ts (add it there first
 * if this is a new class/event).
 *
 * Reads DATABASE_URL from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { isValidEmail } from "../lib/email.ts";
import { isListSlug } from "../lib/lists.ts";

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

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadEnvLocal();
  const csvPath = process.argv[2];
  const list = arg("list");
  const statusFilter = arg("status") ?? "approved";
  const dryRun = process.argv.includes("--dry-run");

  if (!csvPath || csvPath.startsWith("--") || !list) {
    console.error(
      "Usage: node scripts/import-zoom-registrants.mjs <registrants.csv> --list <slug> [--status approved|all] [--dry-run]"
    );
    process.exit(1);
  }
  if (!isListSlug(list)) {
    throw new Error(`"${list}" is not a known list slug — add it to lib/lists.ts (LISTS + LIST_REASON) first.`);
  }
  if (!dryRun && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const raw = readFileSync(csvPath, "utf8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const emailIdx = header.findIndex((h) => h === "email");
  const firstIdx = header.findIndex((h) => h === "first_name");
  const lastIdx = header.findIndex((h) => h === "last_name");
  const statusIdx = header.findIndex((h) => h === "status");
  if (emailIdx === -1) throw new Error(`No "email" column found. Header was: ${rows[0].join(", ")}`);

  const seen = new Set();
  const people = [];
  const skipped = [];
  for (const r of rows.slice(1)) {
    const status = statusIdx !== -1 ? (r[statusIdx] || "").trim().toLowerCase() : "approved";
    if (statusFilter !== "all" && status !== statusFilter) continue;
    const email = (r[emailIdx] || "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    if (!isValidEmail(email)) {
      skipped.push(email);
      continue;
    }
    seen.add(email);
    const first = firstIdx !== -1 ? (r[firstIdx] || "").trim() : "";
    const last = lastIdx !== -1 ? (r[lastIdx] || "").trim() : "";
    const name = [first, last].filter(Boolean).join(" ") || null;
    people.push({ name, email });
  }

  console.log(`Parsed ${rows.length - 1} row(s), ${people.length} unique valid email(s) (status=${statusFilter}).`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} malformed address(es):`);
    skipped.forEach((e) => console.log(`  ${e}`));
  }
  if (dryRun) {
    people.forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[dry run] nothing written. Would import into list "${list}".`);
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  let inserted = 0;
  for (const p of people) {
    await sql`
      INSERT INTO signups (email, name, list)
      VALUES (${p.email}, ${p.name}, ${list})
      ON CONFLICT (email, list) DO NOTHING
    `;
    inserted++;
  }
  console.log(`Done. Imported ${inserted} contact(s) into "${list}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
