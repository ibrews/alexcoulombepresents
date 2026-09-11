#!/usr/bin/env node
/**
 * Sync the Mailgun mailing list behind `members@alexcoulombepresents.com` to
 * whoever currently pays for a membership, so Alex can email that one address
 * from Gmail and reach every current member.
 *
 * Why Mailgun and not a Google Group: alexcoulombepresents.com's MX already
 * points at Mailgun (`mxa/mxb.mailgun.org`), so a list on this domain keeps the
 * right sender identity. A Google Group would also work, but only on a
 * different, Workspace-hosted domain — which would send member mail from the
 * wrong address.
 *
 * Membership is derived from `current-members` (lib/sendNewsletter.ts's
 * listRecipients), i.e. live from billing entitlements — never a hand-kept
 * list. Run it on a cron and the list can't drift from who is actually paying.
 *
 * Usage:
 *   node scripts/mailgun/sync-members-list.mjs                 # dry run
 *   node scripts/mailgun/sync-members-list.mjs --apply         # write
 *   node scripts/mailgun/sync-members-list.mjs --apply --create # also create the list if absent
 *
 * Env (in .env.local or .env.studio):
 *   MAILGUN_API_KEY   required. Mailgun Dashboard → Send → Domain settings →
 *                     Sending/Private API key. NEVER commit it.
 *   MAILGUN_REGION    optional, "us" (default) or "eu" — EU accounts use a
 *                     different API host entirely and silently 401 against the
 *                     US one, which looks like a bad key.
 *   MEMBERS_LIST_ADDRESS  optional, defaults to members@alexcoulombepresents.com
 *
 * Deliberately NEVER deletes a member on a dry run, and prints every add and
 * removal before doing it — this list is how real people get mailed.
 */
import { readFileSync } from "node:fs";
import { listRecipients } from "../../lib/sendNewsletter.ts";
import { CURRENT_MEMBERS_LIST } from "../../lib/lists.ts";

const APPLY = process.argv.includes("--apply");
const CREATE = process.argv.includes("--create");

function loadEnv() {
  for (const file of ["../../.env.studio", "../../.env.local"]) {
    try {
      const txt = readFileSync(new URL(file, import.meta.url), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* optional */
    }
  }
}

loadEnv();

const KEY = process.env.MAILGUN_API_KEY;
const LIST = process.env.MEMBERS_LIST_ADDRESS ?? "members@alexcoulombepresents.com";
const BASE =
  (process.env.MAILGUN_REGION ?? "us").toLowerCase() === "eu"
    ? "https://api.eu.mailgun.net/v3"
    : "https://api.mailgun.net/v3";

if (!KEY) {
  console.error(
    "MAILGUN_API_KEY is not set.\n" +
      "Add it to .env.local (gitignored):  MAILGUN_API_KEY=key-...\n" +
      "Mailgun Dashboard → Send → Domain settings → Sending/Private API key.\n" +
      "If your Mailgun account is EU-hosted, also set MAILGUN_REGION=eu."
  );
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`api:${KEY}`).toString("base64")}`;

async function mg(method, path, form) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: auth,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* Mailgun returns HTML on some auth failures */
  }
  if (!res.ok) {
    const hint =
      res.status === 401
        ? " — 401 usually means the key is wrong OR the account is EU-hosted and needs MAILGUN_REGION=eu"
        : "";
    throw new Error(`Mailgun ${method} ${path} failed (${res.status})${hint}: ${text.slice(0, 300)}`);
  }
  return json;
}

// ── Desired state: who currently pays ───────────────────────────────────────
const desired = await listRecipients(CURRENT_MEMBERS_LIST);
if (desired.length === 0) {
  console.error(
    "Refusing to sync: `current-members` resolved to 0 people.\n" +
      "That is almost certainly a DB/config problem, not a real empty membership — " +
      "and emptying the list on a bad read is not recoverable from here."
  );
  process.exit(1);
}
console.log(`current-members → ${desired.length} member(s):`);
for (const e of desired) console.log(`  ${e}`);

// ── Does the list exist? ────────────────────────────────────────────────────
let exists = true;
try {
  await mg("GET", `/lists/${encodeURIComponent(LIST)}`);
} catch (err) {
  if (!/failed \(404\)/.test(String(err))) throw err;
  exists = false;
}

if (!exists) {
  console.log(`\nList ${LIST} does not exist yet.`);
  if (!(APPLY && CREATE)) {
    console.log("Re-run with --apply --create to create it. It would be created as:");
    console.log("  access_level=readonly      (only Alex can post — members can't reply-all to everyone)");
    console.log("  reply_preference=sender    (replies go to whoever sent, not back to the whole list)");
    process.exit(0);
  }
  await mg("POST", "/lists", {
    address: LIST,
    name: "Alex Coulombe Presents — Members",
    description: "Current paying members. Synced from billing by scripts/mailgun/sync-members-list.mjs.",
    // readonly: only authorized senders can post. This is an announcement list,
    // so a member cannot accidentally mail every other member.
    access_level: "readonly",
    // Replies go to the person who sent the message, not to the whole list.
    reply_preference: "sender",
  });
  console.log(`Created ${LIST}`);
}

// ── Current members on the Mailgun side ─────────────────────────────────────
const current = new Set();
if (exists || APPLY) {
  let next = `/lists/${encodeURIComponent(LIST)}/members/pages?limit=100`;
  while (next) {
    const page = await mg("GET", next);
    for (const m of page?.items ?? []) current.add(String(m.address).toLowerCase());
    const url = page?.paging?.next;
    if (!url || (page?.items ?? []).length === 0) break;
    next = url.replace(BASE, "");
  }
}

const desiredSet = new Set(desired.map((e) => e.toLowerCase()));
const toAdd = [...desiredSet].filter((e) => !current.has(e));
const toRemove = [...current].filter((e) => !desiredSet.has(e));

console.log(`\nMailgun list currently has ${current.size} member(s).`);
console.log(`  to add:    ${toAdd.length ? toAdd.join(", ") : "(none)"}`);
console.log(`  to remove: ${toRemove.length ? toRemove.join(", ") : "(none)"}`);

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply.");
  process.exit(0);
}

if (toAdd.length) {
  // upsert so a re-run is a no-op rather than an error.
  await mg("POST", `/lists/${encodeURIComponent(LIST)}/members.json`, {
    members: JSON.stringify(toAdd.map((address) => ({ address, subscribed: true }))),
    upsert: "yes",
  });
  console.log(`Added ${toAdd.length}`);
}
for (const address of toRemove) {
  await mg("DELETE", `/lists/${encodeURIComponent(LIST)}/members/${encodeURIComponent(address)}`);
  console.log(`Removed ${address}`);
}
console.log("\nDone. Email " + LIST + " from Gmail to reach every current member.");
