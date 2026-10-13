#!/usr/bin/env node
/**
 * Send PART of an issue through Resend and leave the rest for the manual Gmail
 * kit (scripts/manual-send-kit.mjs → scripts/gmail-drafts-from-kit.py).
 *
 *   node --env-file=.env.studio scripts/newsletter-split-send.mjs <slug> --pick non-us [--limit 40] [--dry-run]
 *   node --env-file=.env.studio scripts/newsletter-split-send.mjs <slug> --pick bounce-prone [--limit 58] [--dry-run]
 *
 * Why: Resend's free tier caps at 100 emails/day, and that cap is SHARED with
 * the site's login, purchase and booking mail. Spend it on the people who
 * benefit most from Resend and keep headroom for transactional mail.
 *
 *   non-us        country-code domains, non-US webmail (gmx, web.de, qq.com,
 *                 hotmail.co.uk…), signup text naming a non-US country. Goes
 *                 out first, so it lands in their morning.
 *   bounce-prone  everyone a Gmail-alias send is likely to lose: past alias
 *                 bounces, Yahoo/AT&T/AOL family, Microsoft and Apple consumer
 *                 mail, then .edu/.gov and large-company filters.
 *
 * Bookkeeping matches a Studio send: the first send takes the campaign claim
 * (so a full Studio send can't follow by accident), every recipient lands in
 * email_events (so the manual kit skips them), and the issue file gets its
 * sentAt/sentList/sentCount stamp. Sends go in chunks of 10, so hitting the
 * daily cap mid-way keeps whatever already went. Commit the issue file after.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { sendCampaign, claimCampaignSend, listRecipients } from "../lib/sendNewsletter.ts";
import { LISTS, LIST_REASON } from "../lib/lists.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SITE_URL = "https://alexcoulombepresents.com";
// The Aug 2, 2026 issue's Gmail-alias bounces were re-sent through Resend
// after Aug 4 — those addresses are known to reject alias mail.
const ALIAS_BOUNCE_CAMPAIGN = "2026-08-02-new-classes-and-the-lab";
const ALIAS_BOUNCE_SINCE = "2026-08-04T00:00:00Z";

const args = process.argv.slice(2);
const slug = args[0];
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const pick = opt("--pick");
const limit = Number(opt("--limit") ?? 40);
if (!slug || !["non-us", "bounce-prone"].includes(pick)) {
  console.error("Usage: node --env-file=.env.studio scripts/newsletter-split-send.mjs <slug> --pick non-us|bounce-prone [--limit N] [--dry-run]");
  process.exit(2);
}

const file = path.join(ROOT, "content/newsletters", `${slug}.md`);
const raw = readFileSync(file, "utf8");
const sep = raw.indexOf("\n---\n");
const meta = Object.fromEntries(
  raw.slice(0, sep).split("\n").map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()])
);
const body = raw.slice(sep + 5);
const lists = Object.keys(LISTS).filter((l) => l !== "current-members");

const sql = neon(process.env.DATABASE_URL);
const delivered = new Set(
  (await sql`SELECT DISTINCT email FROM email_events WHERE campaign = ${slug} AND type = 'send'`).map((r) => r.email)
);
const pool = (await listRecipients(lists)).filter((e) => !delivered.has(e));
const domain = (e) => e.split("@")[1] ?? "";

let chosen;
if (pick === "non-us") {
  const generic2 = new Set(["us", "io", "co", "ai", "me", "tv", "fm", "ly", "gg", "so", "to", "cc", "ws", "sh", "vc", "la", "im"]);
  const providers = /^(web\.de|gmx\.(de|net|at|ch)|t-online\.de|freenet\.de|yandex\.(ru|com)|mail\.ru|qq\.com|163\.com|126\.com|naver\.com|daum\.net|libero\.it|orange\.fr|free\.fr|laposte\.net|wanadoo\.fr|btinternet\.com|sky\.com|virginmedia\.com|bigpond\.com|shaw\.ca|rogers\.com|sympatico\.ca|telus\.net|videotron\.ca|rediffmail\.com|protonmail\.ch|seznam\.cz|wp\.pl|o2\.pl|interia\.pl|ukr\.net|abv\.bg|ziggo\.nl|kpnmail\.nl|bluewin\.ch|hotmail\.(co\.uk|fr|de|it|es)|yahoo\.(co\.uk|co\.jp|fr|de|it|es|com\.br|co\.in|ca))$/i;
  // "based in"/"from"/"live in" phrasing only: a bare city name was a false
  // positive on the first run ("Part 2 of the Unreal Fest Prague talk").
  const place = "uk|united kingdom|england|scotland|ireland|canada|australia|new zealand|germany|france|spain|italy|netherlands|belgium|sweden|norway|denmark|finland|poland|portugal|switzerland|austria|india|brazil|mexico|argentina|chile|colombia|japan|korea|china|taiwan|singapore|hong kong|philippines|indonesia|malaysia|thailand|vietnam|israel|turkey|egypt|nigeria|south africa|kenya|uae|pakistan|bangladesh|ukraine|czech|hungary|romania|greece";
  const lives = new RegExp(`\\b(based in|from|live in|living in|located in|in the|startups? .{0,20}for)\\s+(${place})\\b|,\\s*(${place})\\b|\\b(${place})\\b\\s*$`, "i");
  const text = Object.fromEntries(
    (await sql`SELECT lower(email) AS email, string_agg(coalesce(message, ''), ' | ') AS t FROM signups GROUP BY 1`).map((r) => [r.email, r.t ?? ""])
  );
  chosen = pool.filter((e) => {
    const d = domain(e);
    const tld = d.split(".").pop();
    return providers.test(d) || (tld?.length === 2 && !generic2.has(tld)) || lives.test(text[e] ?? "");
  });
} else {
  const aliasBounced = new Set(
    (await sql`SELECT email FROM email_events WHERE campaign = ${ALIAS_BOUNCE_CAMPAIGN} AND type = 'send'
               GROUP BY email HAVING min(created_at) >= ${ALIAS_BOUNCE_SINCE}`).map((r) => r.email)
  );
  const yahooFamily = /^(yahoo\.|ymail\.com|rocketmail\.com|aol\.com|aim\.com|att\.net|sbcglobal\.net|bellsouth\.net|prodigy\.net|pacbell\.net|swbell\.net|verizon\.net|frontier(net)?\.(com|net))/;
  const microsoft = /^(outlook\.|hotmail\.|live\.|msn\.com|windowslive\.com)/;
  const apple = /^(icloud\.com|me\.com|mac\.com)$/;
  const webmail = /^(gmail\.com|googlemail\.com|comcast\.net|protonmail\.com|proton\.me|duck\.com|simplelogin\.com)$/;
  const rank = (e) => {
    const d = domain(e);
    if (aliasBounced.has(e)) return 0;
    if (yahooFamily.test(d)) return 1;
    if (microsoft.test(d)) return 2;
    if (apple.test(d)) return 3;
    if (/\.(edu|gov|mil)$/.test(d)) return 4;
    if (!webmail.test(d)) return 5; // company / org mail behind a corporate filter
    return 99;
  };
  chosen = pool.map((e) => [e, rank(e)]).filter(([, r]) => r < 99).sort((a, b) => a[1] - b[1]).map(([e]) => e);
}
chosen = chosen.slice(0, limit);

console.log(`"${meta.subject || meta.title}" — ${delivered.size} already delivered, ${pool.length} waiting, sending ${chosen.length} (${pick}).`);
for (const [d, n] of Object.entries(chosen.reduce((m, e) => ((m[domain(e)] = (m[domain(e)] ?? 0) + 1), m), {}))
  .sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${n.toString().padStart(3)}  ${d}`);
if (flag("--dry-run") || !chosen.length) process.exit(0);

if (!meta.sentAt) {
  const claimed = await claimCampaignSend(slug, lists);
  if (!claimed) {
    console.error("This campaign already has a send claim but the issue file has no sentAt — check the Studio report before sending.");
    process.exit(1);
  }
}
let sent = 0;
const errors = [];
for (let i = 0; i < chosen.length; i += 10) {
  const chunk = chosen.slice(i, i + 10);
  const r = await sendCampaign({
    campaign: slug, subject: meta.subject || meta.title, bodyMarkdown: body, list: lists,
    reason: LIST_REASON.newsletter, broad: true, onlyTo: chunk,
    webUrl: `${SITE_URL}/newsletter/${slug}`, preheader: meta.preheader || undefined,
  });
  sent += r.sent;
  errors.push(...r.errors);
  if (r.sent < chunk.length) break; // daily cap or a bad address — stop, keep what went
}

const stamp = meta.sentAt
  ? { ...meta, sentCount: String((Number(meta.sentCount) || 0) + sent) }
  : { ...meta, sentAt: new Date().toISOString(), sentList: lists.join(","), sentCount: String(sent) };
const order = ["title", "date", "subject", "preheader", "sentAt", "sentList", "sentCount"];
const head = Object.entries(stamp).filter(([k, v]) => k && v !== undefined && v !== "")
  .sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
  .map(([k, v]) => `${k}: ${v}`).join("\n");
if (sent > 0) writeFileSync(file, `${head}\n---\n${body}`);
console.log(JSON.stringify({ sent, attempted: chosen.length, errors }));
if (sent > 0) console.log(`Stamped ${slug}.md (sentCount ${stamp.sentCount}). Commit it so the web version goes live.`);
