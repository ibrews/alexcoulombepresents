#!/usr/bin/env node
/**
 * Invite every paid-up member to every upcoming class + this week's office
 * hours, right now. Run this after adding new classes to wednesdayCalendar
 * (lib/store.ts) AND deploying — it calls the live site's admin endpoint, so
 * the new classes must already be in the deployed build.
 *
 * Usage:
 *   ADMIN_KEY=... node scripts/zoom/invite-members-now.mjs [--site https://alexcoulombepresents.com] [--email a@b.com ...]
 *
 * ADMIN_KEY comes from the environment or .env.local. Safe to re-run: members
 * Zoom already has are skipped, so nobody gets a duplicate email.
 */
import { readFileSync } from "node:fs";

try {
  const txt = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on real env */
}

const args = process.argv.slice(2);
let site = "https://alexcoulombepresents.com";
const emails = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--site") site = args[++i];
  else if (args[i] === "--email") emails.push(args[++i]);
}
if (!process.env.ADMIN_KEY) {
  console.error("ADMIN_KEY is not set (env or .env.local).");
  process.exit(1);
}

const res = await fetch(`${site.replace(/\/$/, "")}/api/admin/invite-members`, {
  method: "POST",
  headers: { "x-admin-key": process.env.ADMIN_KEY, "content-type": "application/json" },
  body: JSON.stringify(emails.length ? { emails } : {}),
});
const json = await res.json().catch(() => ({}));
if (!res.ok && res.status !== 207) {
  console.error(`HTTP ${res.status}`, json);
  process.exit(1);
}
for (const r of json.results ?? []) {
  console.log(`${r.target.padEnd(40)} ${r.action}  registered ${r.registered}, skipped ${r.skipped}, failed ${r.failed}`);
}
if (json.skipped) console.log(json.skipped);
if (!json.ok) {
  console.error("Some invites failed — see counts above / server logs.");
  process.exit(2);
}
