#!/usr/bin/env node
/**
 * Comp someone a membership — by default lifetime Insider, the standing
 * thank-you for every guest instructor once they've taught (Alex, 2026-10-06).
 * Grants the membership, emails them a magic sign-in link, and registers them
 * on every upcoming class + office hours. Calls the live site's
 * POST /api/admin/comp-membership, so it does exactly what the deployed code does.
 *
 * Usage:
 *   node scripts/comp-membership.mjs --email jane@example.com --name "Jane Doe" --dry-run
 *   node scripts/comp-membership.mjs --email jane@example.com --name "Jane Doe"
 *
 * Options:
 *   --email <addr>     required
 *   --name <name>      their name, for the greeting
 *   --dry-run          show what would happen + the exact email, change nothing
 *   --tier <id>        starter | unlimited | insider (default insider)
 *   --months <n>       a fixed term instead of lifetime
 *   --no-email         grant + invite without sending the email
 *   --force            re-send the email and invites even if nothing changed
 *   --site <url>       default $SITE_URL, $NEXT_PUBLIC_SITE_URL, or https://alexcoulombepresents.com
 *
 * ADMIN_KEY comes from the environment or .env.local. Safe to re-run: a second
 * run for the same person changes nothing and sends nothing (unless --force).
 */
import { readFileSync } from "node:fs";

try {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on real env */
}

const args = process.argv.slice(2);
const body = {};
let site = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--email") body.email = args[++i];
  else if (a === "--name") body.name = args[++i];
  else if (a === "--tier") body.tier = args[++i];
  else if (a === "--months") body.months = Number(args[++i]);
  else if (a === "--dry-run") body.dryRun = true;
  else if (a === "--no-email") body.sendEmail = false;
  else if (a === "--force") body.force = true;
  else if (a === "--site") site = args[++i];
  else {
    console.error(`Unknown argument: ${a}`);
    process.exit(1);
  }
}
if (!body.email) {
  console.error('Usage: node scripts/comp-membership.mjs --email <addr> [--name "Full Name"] [--dry-run]');
  process.exit(1);
}
if (!process.env.ADMIN_KEY) {
  console.error("ADMIN_KEY is not set (env or .env.local).");
  process.exit(1);
}

const res = await fetch(`${site.replace(/\/$/, "")}/api/admin/comp-membership`, {
  method: "POST",
  headers: { "x-admin-key": process.env.ADMIN_KEY, "content-type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json().catch(() => ({}));
if (!res.ok && res.status !== 207) {
  console.error(`HTTP ${res.status}`, json);
  process.exit(1);
}

const g = json.grant ?? {};
console.log(`${json.dryRun ? "[DRY RUN] " : ""}${json.email}: ${g.action} → ${g.tier} ${g.until ? `until ${g.until}` : "(lifetime)"}`);
console.log(`  customer: ${json.customer?.existed ? `existing #${json.customer.id}` : json.dryRun ? "would be created" : `created #${json.customer?.id}`}`);
const n = json.notification ?? {};
console.log(`  email: ${n.sent ? "sent" : n.error ? `FAILED — ${n.error}` : `not sent (${n.skipped})`}`);
const inv = json.invites ?? {};
console.log(`  invites: ${inv.ran ? (inv.ok ? "registered on upcoming sessions" : `had failures${inv.error ? ` — ${inv.error}` : ""}`) : `not run (${inv.skipped})`}`);
for (const w of json.warnings ?? []) console.log(`  ! ${w}`);
if (json.dryRun && n.subject) {
  console.log(`\n--- email preview ---\nSubject: ${n.subject}\n\n${n.text}`);
}
if (!json.ok) process.exit(2);
