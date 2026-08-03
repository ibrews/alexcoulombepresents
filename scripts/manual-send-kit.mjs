#!/usr/bin/env node
/**
 * Manual send kit — send an issue by hand from Gmail when the ESP can't.
 *
 *   node scripts/manual-send-kit.mjs <slug>              # build the kit
 *   node scripts/manual-send-kit.mjs <slug> --record 1   # mark group 1 sent
 *
 * Why this exists: Resend's free tier caps at 100 emails/day, so a 400-person
 * issue can strand hundreds of people mid-send. Gmail's web UI allows 500
 * recipients/day, so pasting the issue into Gmail and BCC-ing the stragglers
 * in batches clears the backlog same-day without paying for a plan tier.
 *
 * What it generates, into .manual-send/<slug>/:
 *   - newsletter.html   open in a browser, Select All → Copy → paste in Gmail
 *   - group-N.txt       comma-separated BCC batch, ready to paste
 *   - README.txt        the steps, with the exact counts for this issue
 *
 * Two things differ from a normal send, both deliberate:
 *   - No open/click tracking. Those are per-recipient URLs; a BCC batch shares
 *     one body, so there's nothing honest to measure.
 *   - The footer points at the typed-address /unsubscribe page instead of a
 *     one-click HMAC link, for the same reason. Opting out still works.
 *
 * --record writes the batch into email_events so the Studio's report and its
 * resend-missed diff stay truthful — run it right after Gmail says "sent",
 * or those people look un-emailed forever and risk a duplicate later.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNewsletterEmail } from "../lib/newsletterEmail.ts";
import { recordSendEvents } from "../lib/tracking.ts";
import { isListSlug } from "../lib/lists.ts";
import { neon } from "@neondatabase/serverless";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://alexcoulombepresents.com";

// Gmail free accounts: 500 recipients/day, and the web composer rejects a
// single message over ~100. 90 leaves headroom for both.
const GROUP_SIZE = 90;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Studio writes secrets to .env.studio (vercel env pull keeps clobbering
// .env.local) — first non-empty value wins, same order the Studio uses.
function loadEnv() {
  for (const file of [".env.studio", ".env.local"]) {
    const p = path.join(ROOT, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]] && m[2].trim()) process.env[m[1]] = m[2].trim();
    }
  }
}

function loadIssue(slug) {
  const file = path.join(ROOT, "content/newsletters", `${slug}.md`);
  if (!existsSync(file)) throw new Error(`No such issue: ${slug}`);
  const raw = readFileSync(file, "utf8");
  const [meta, ...rest] = raw.split("\n---\n");
  const issue = { body: rest.join("\n---\n").trim() };
  for (const line of meta.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) issue[m[1]] = m[2];
  }
  return issue;
}

/** Everyone on the issue's lists that email_events can't confirm received it. */
async function missedRecipients(campaign, lists) {
  const sql = neon(process.env.DATABASE_URL);
  const all = await sql`SELECT DISTINCT lower(email) AS email FROM signups WHERE list = ANY(${lists}) ORDER BY email`;
  const sent = await sql`SELECT DISTINCT email FROM email_events WHERE campaign = ${campaign} AND type = 'send'`;
  const sentSet = new Set(sent.map((r) => r.email));
  const missed = all.map((r) => r.email).filter((e) => !sentSet.has(e));
  return {
    valid: missed.filter((e) => EMAIL_RE.test(e)),
    malformed: missed.filter((e) => !EMAIL_RE.test(e)),
    total: all.length,
    delivered: sentSet.size,
  };
}

function groupsOf(emails, size) {
  const out = [];
  for (let i = 0; i < emails.length; i += size) out.push(emails.slice(i, i + size));
  return out;
}

const [, , slug, flag, flagValue] = process.argv;
if (!slug) {
  console.error("Usage: node scripts/manual-send-kit.mjs <slug> [--record <group-number>]");
  process.exit(1);
}
loadEnv();
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked .env.studio and .env.local).");
  process.exit(1);
}

const issue = loadIssue(slug);
const outDir = path.join(ROOT, ".manual-send", slug);

if (flag === "--record") {
  const n = Number(flagValue);
  const file = path.join(outDir, `group-${n}.txt`);
  if (!Number.isInteger(n) || !existsSync(file)) {
    console.error(`No such group file: ${file}\nRun without --record first to build the kit.`);
    process.exit(1);
  }
  const emails = readFileSync(file, "utf8").split(",").map((e) => e.trim()).filter(Boolean);
  await recordSendEvents(slug, emails);
  console.log(`✓ Recorded group ${n} — ${emails.length} addresses now count as delivered for "${slug}".`);
  console.log(`  The Studio report and resend-missed diff will reflect this immediately.`);
  process.exit(0);
}

const lists = (issue.sentList ?? "").split(",").map((s) => s.trim()).filter(isListSlug);
if (!lists.length) throw new Error(`Issue "${slug}" has no sentList — was it ever sent?`);
const m = await missedRecipients(slug, lists);

if (!m.valid.length) {
  console.log(`Nothing to send — all ${m.total} recipients are confirmed delivered.`);
  process.exit(0);
}

// Generic footer: no HMAC token (a BCC batch can't carry a per-person one),
// so it points at the typed-address unsubscribe page instead.
const footerHtml =
  `<a href="${SITE}/newsletter/${slug}" style="color:#888">View this issue in your browser.</a> ` +
  `You&rsquo;re receiving this newsletter because you expressed interest in Unreal Engine and related training and tools. ` +
  `<a href="${SITE}/unsubscribe" style="color:#888">To unsubscribe, click here.</a>`;

const html = renderNewsletterEmail({
  bodyMarkdown: issue.body,
  footerHtml,
  siteUrl: SITE,
  preheader: issue.preheader || undefined,
});

const groups = groupsOf(m.valid, GROUP_SIZE);
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "newsletter.html"), html);
groups.forEach((g, i) => writeFileSync(path.join(outDir, `group-${i + 1}.txt`), g.join(", ")));

const readme = `MANUAL SEND — ${issue.title}
${"=".repeat(60)}

Subject line (paste into Gmail's Subject field):
${issue.subject || issue.title}

Status: ${m.delivered} of ${m.total} already delivered. ${m.valid.length} still need it.
${m.malformed.length ? `\nEXCLUDED — ${m.malformed.length} malformed address(es) in the DB, not sendable as stored:\n${m.malformed.map((e) => `  ${e}`).join("\n")}\n` : ""}
STEPS
-----
1. Open newsletter.html in a browser.
2. Click into the page, Select All (Cmd+A), Copy (Cmd+C).
3. In Gmail, hit Compose. Set "From" to info@alexcoulombepresents.com.
4. Paste (Cmd+V) into the body. Paste the subject line above.
5. Click "Bcc". Paste the contents of group-1.txt into the Bcc field.
   Leave "To" EMPTY — or put your own address there, never a subscriber's.
6. Send. Then immediately run:
      node scripts/manual-send-kit.mjs ${slug} --record 1
7. Repeat steps 3-6 for each remaining group file.

GROUPS (${groups.length} total, ${GROUP_SIZE} max per message)
${groups.map((g, i) => `  group-${i + 1}.txt — ${g.length} recipients`).join("\n")}

WHY BCC: every address in Bcc is hidden from the others. A subscriber list
pasted into "To" or "Cc" would expose every subscriber's address to all of
them — an irreversible privacy breach. Double-check the field before sending.

GMAIL LIMIT: 500 recipients per rolling 24 hours on a free account. This send
is ${m.valid.length} total, so it fits in one day — but if you have already sent a lot
from this account today, spread the groups out.

TRACKING: this manual path records no opens or clicks (a shared BCC body
can't carry per-person tracking). The Studio report will show the sends via
--record, but open/click rates only reflect the ${m.delivered} sent through Resend.
`;
writeFileSync(path.join(outDir, "README.txt"), readme);

console.log(readme);
console.log(`\n✦ Kit written to ${path.relative(ROOT, outDir)}/`);
console.log(`  open ${path.relative(ROOT, path.join(outDir, "newsletter.html"))}`);
