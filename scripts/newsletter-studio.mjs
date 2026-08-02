#!/usr/bin/env node
/**
 * Newsletter Studio — the whole newsletter operation in one local app.
 *
 *   npm run studio        (or: node scripts/newsletter-studio.mjs)
 *
 * What you get, MailChimp-style but local-first:
 *   - Dashboard: every issue (draft vs sent), audience counts per list
 *   - Editor: toolbar, drag-drop images (auto-resized), live email preview
 *   - Test send: mail the current draft to yourself before anything real
 *   - Send flow: pick a list, see the live recipient count, type the count
 *     to confirm — nothing sends without that explicit human step
 *   - Reports: opens, clicks, top links, unsubscribes per campaign
 *
 * Everything is files + your own database: issues are content/newsletters/
 * markdown (git-versioned), images land in public/newsletter/, subscribers
 * live in your Neon DB, sends go through your Resend account. No vendor
 * lock-in, nothing to export later — this IS the export.
 *
 * Local-only by construction: binds 127.0.0.1. Reads DATABASE_URL,
 * RESEND_API_KEY, AUTH_SECRET from .env.local / the environment; the UI
 * degrades gracefully (with visible status chips) when one is missing.
 */
import { createServer } from "node:http";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNewsletterEmail } from "../lib/newsletterEmail.ts";
import { LISTS, LIST_REASON, isListSlug } from "../lib/lists.ts";
import {
  sendCampaign,
  listRecipients,
  claimCampaignSend,
  completeCampaignSend,
  getCampaignSends,
} from "../lib/sendNewsletter.ts";
import { campaignStats } from "../lib/tracking.ts";
import { neon } from "@neondatabase/serverless";

const SITE_URL = "https://alexcoulombepresents.com";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NEWSLETTER_DIR = path.join(ROOT, "content", "newsletters");
const IMAGE_DIR = path.join(ROOT, "public", "newsletter");
const SEND_LOG = path.join(ROOT, ".newsletter-sends.jsonl");
const PORT = Number(process.env.STUDIO_PORT ?? 4848);

mkdirSync(IMAGE_DIR, { recursive: true });
loadEnvLocal();

function loadEnvLocal() {
  // .env.studio FIRST — it's the studio's own secrets file, safe from the
  // `vercel env pull` clobbering that keeps emptying .env.local. Values
  // already set win, so .env.studio effectively overrides .env.local.
  for (const file of [".env.studio", ".env.local"]) {
    try {
      const txt = readFileSync(path.join(ROOT, file), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          const v = m[2].replace(/^["']|["']$/g, "");
          if (v) process.env[m[1]] = v;
        }
      }
    } catch {
      /* file absent — fine */
    }
  }
}

// ── Issue store (content/newsletters/*.md) ──────────────────────────────────

function parseIssue(file) {
  const raw = readFileSync(path.join(NEWSLETTER_DIR, file), "utf8");
  const [header, ...rest] = raw.split(/^---$/m);
  const get = (key) => header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
  return {
    slug: file.replace(/\.md$/, ""),
    title: get("title"),
    date: get("date"),
    subject: get("subject"),
    preheader: get("preheader"),
    sentAt: get("sentAt"),
    sentList: get("sentList"),
    sentCount: get("sentCount"),
    sendAt: get("sendAt"),
    sendLists: get("sendLists"),
    sendBroad: get("sendBroad"),
    body: rest.join("---").trim(),
  };
}

function listIssues() {
  return readdirSync(NEWSLETTER_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse()
    .map(parseIssue);
}

function loadIssue(slug) {
  const file = `${slug}.md`;
  if (!existsSync(path.join(NEWSLETTER_DIR, file))) return null;
  return parseIssue(file);
}

// One writer for the frontmatter block so save/schedule/sent-stamping can't
// drop each other's lines.
function writeIssue(slug, issue) {
  const meta = [`title: ${issue.title}`, `date: ${issue.date}`, `subject: ${issue.subject}`];
  if (issue.preheader) meta.push(`preheader: ${issue.preheader}`);
  if (issue.sendAt) {
    meta.push(`sendAt: ${issue.sendAt}`, `sendLists: ${issue.sendLists}`, `sendBroad: ${issue.sendBroad || "0"}`);
  }
  if (issue.sentAt) {
    meta.push(`sentAt: ${issue.sentAt}`, `sentList: ${issue.sentList}`, `sentCount: ${issue.sentCount}`);
  }
  writeFileSync(path.join(NEWSLETTER_DIR, `${slug}.md`), `${meta.join("\n")}\n---\n${issue.body.trim()}\n`);
}

function saveIssue(slug, { title, date, subject, preheader, body }) {
  const existing = loadIssue(slug) ?? {};
  writeIssue(slug, { ...existing, title, date, subject, preheader: preheader ?? existing.preheader, body });
}

function markSent(slug, lists, count) {
  const issue = loadIssue(slug);
  if (!issue) return;
  writeIssue(slug, {
    ...issue,
    sendAt: "", // schedule is consumed once sent
    sentAt: new Date().toISOString(),
    sentList: Array.isArray(lists) ? lists.join(",") : lists,
    sentCount: count,
  });
}

function markScheduled(slug, { sendAt, sendLists, sendBroad }) {
  const issue = loadIssue(slug);
  if (!issue) return;
  writeIssue(slug, { ...issue, sendAt, sendLists, sendBroad });
}

function clearSchedule(slug) {
  const issue = loadIssue(slug);
  if (!issue) return;
  writeIssue(slug, { ...issue, sendAt: "" });
}

// Publish an issue (+ every /newsletter/ image it references) straight to
// MAIN — production deploys from main, and the cron sender only sees what's
// deployed, so scheduling without a main push would silently never fire.
// Uses a temp worktree so it works no matter what branch (or how dirty) the
// local checkout is, and never drags unrelated WIP along.
function gitPublish(slug, message) {
  const issue = loadIssue(slug);
  const files = [`content/newsletters/${slug}.md`];
  for (const m of issue.body.matchAll(/\/newsletter\/([\w][\w.\-]*)/g)) {
    if (existsSync(path.join(IMAGE_DIR, m[1]))) files.push(`public/newsletter/${m[1]}`);
  }
  const wt = path.join("/tmp", `studio-publish-${Date.now()}`);
  const run = (cmd, cwd) => execSync(cmd, { cwd: cwd ?? ROOT, stdio: "pipe" }).toString();
  try {
    run(`git fetch origin main`);
    run(`git worktree add "${wt}" origin/main`);
    for (const f of files) {
      mkdirSync(path.dirname(path.join(wt, f)), { recursive: true });
      writeFileSync(path.join(wt, f), readFileSync(path.join(ROOT, f)));
    }
    run(`git add -A`, wt);
    try {
      run(`git commit -m ${JSON.stringify(message)} -m "Via Newsletter Studio."`, wt);
    } catch (err) {
      const out = String(err.stdout ?? "") + String(err.stderr ?? "");
      if (out.includes("nothing to commit")) return; // already on main — done
      throw new Error(`git commit failed: ${out.slice(0, 400)}`);
    }
    run(`git push origin HEAD:main`, wt);
  } finally {
    try {
      run(`git worktree remove --force "${wt}"`);
    } catch { /* best-effort cleanup */ }
  }
}

// ── Audience / env status ───────────────────────────────────────────────────

async function audienceCounts() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const sql = neon(url);
    const rows = await sql`SELECT list, COUNT(DISTINCT email)::int AS count FROM signups GROUP BY list ORDER BY count DESC`;
    const total = await sql`SELECT COUNT(DISTINCT email)::int AS n FROM signups`;
    return { lists: rows, total: total[0].n };
  } catch (err) {
    console.error("[studio] audience query failed:", err.message);
    return null;
  }
}

async function subscribers(list, query) {
  const sql = neon(process.env.DATABASE_URL);
  if (query) {
    const q = `%${query}%`;
    return await sql`SELECT email, name, list, created_at FROM signups WHERE (email ILIKE ${q} OR name ILIKE ${q}) ORDER BY created_at DESC LIMIT 200`;
  }
  if (list) {
    return await sql`SELECT email, name, list, created_at FROM signups WHERE list = ${list} ORDER BY created_at DESC LIMIT 200`;
  }
  return await sql`SELECT email, name, list, created_at FROM signups ORDER BY created_at DESC LIMIT 200`;
}

function envStatus() {
  return {
    db: !!process.env.DATABASE_URL,
    resend: !!process.env.RESEND_API_KEY,
    auth: !!process.env.AUTH_SECRET,
  };
}

// ── HTML helpers ────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: #0a0a12; color: #e5e5ea; }
  a { color: #14b8a6; text-decoration: none; }
  a:hover { text-decoration: underline; }
  header { padding: 13px 22px; border-bottom: 1px solid #23232e; display: flex; align-items: center; gap: 18px; position: sticky; top: 0; background: #0a0a12ee; backdrop-filter: blur(8px); z-index: 5; }
  header .brand { font-family: monospace; font-size: 14px; font-weight: 700; color: #14b8a6; }
  header nav { display: flex; gap: 14px; font-size: 13px; }
  header .chips { margin-left: auto; display: flex; gap: 8px; }
  .chip { font-family: monospace; font-size: 10px; padding: 3px 9px; border-radius: 999px; border: 1px solid #2a2a36; color: #7a7a85; }
  .chip.ok { border-color: #14b8a644; color: #14b8a6; }
  .chip.bad { border-color: #f59e0b66; color: #fbbf24; }
  main { max-width: 1200px; margin: 0 auto; padding: 26px 22px 60px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #7a7a85; font-size: 13px; margin: 0 0 22px; }
  .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
  .card { background: #101018; border: 1px solid #23232e; border-radius: 12px; padding: 18px; }
  .card h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7a85; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a5a65; padding: 6px 8px; border-bottom: 1px solid #23232e; }
  td { padding: 9px 8px; border-bottom: 1px solid #1a1a24; }
  tr:hover td { background: #14141e; }
  .badge { font-family: monospace; font-size: 10px; padding: 2px 8px; border-radius: 999px; }
  .badge.draft { background: #f59e0b22; color: #fbbf24; }
  .badge.sent { background: #14b8a622; color: #14b8a6; }
  button, .btn { background: #14b8a6; color: #0a0a12; border: none; padding: 9px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-block; }
  button:hover, .btn:hover { opacity: 0.9; text-decoration: none; }
  button.secondary, .btn.secondary { background: transparent; border: 1px solid #2a2a36; color: #e5e5ea; }
  button.danger, .btn.danger { background: #ef4444; color: #fff; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  input[type=text], input[type=email], select { padding: 9px 11px; background: #16161f; border: 1px solid #2a2a36; border-radius: 6px; color: #e5e5ea; font-size: 14px; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #7a7a85; margin: 14px 0 5px; }
  .stat { text-align: center; padding: 12px; }
  .stat .n { font-size: 26px; font-weight: 700; color: #ecedf6; }
  .stat .l { font-size: 11px; color: #7a7a85; margin-top: 2px; }
  .statrow { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 6px; }
  .error-banner { display:none; margin-top: 10px; padding: 10px 12px; background: #3a1a1a; border: 1px solid #7a2a2a; border-radius: 6px; color: #ff8080; font-size: 12px; line-height: 1.5; }
  .error-banner.show { display: block; }
  .hint { font-size: 11px; color: #5a5a65; margin-top: 6px; line-height: 1.5; }
`;

function chips() {
  const s = envStatus();
  const chip = (ok, okText, badText) =>
    `<span class="chip ${ok ? "ok" : "bad"}" title="${ok ? okText : badText}">${ok ? okText : badText}</span>`;
  return `<div class="chips">
    ${chip(s.db, "audience db ✓", "audience db missing")}
    ${chip(s.resend, "resend ✓", "resend key missing")}
    ${chip(s.auth, "auth ✓", "AUTH_SECRET missing")}
  </div>`;
}

function layout(title, body, { active = "" } = {}) {
  const nav = [
    ["/", "Issues"],
    ["/audience", "Audience"],
  ]
    .map(([href, label]) => `<a href="${href}" style="${active === href ? "color:#ecedf6;font-weight:600" : ""}">${label}</a>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${STYLE}</style></head>
<body><header><span class="brand">✦ Newsletter Studio</span><nav>${nav}</nav>${chips()}</header><main>${body}</main></body></html>`;
}

// ── Pages ───────────────────────────────────────────────────────────────────

async function dashboardPage() {
  // Reconcile first: a schedule that fired in PRODUCTION completed in the DB
  // (campaign_sends), not in the local frontmatter — stamp it now so the
  // dashboard tells the truth without any manual step.
  if (envStatus().db) {
    try {
      for (const row of await getCampaignSends()) {
        if (!row.completed_at || !row.sent) continue;
        const issue = loadIssue(row.campaign);
        if (issue && !issue.sentAt) markSent(row.campaign, row.lists, row.sent);
      }
    } catch { /* reconcile is best-effort — dashboard still renders */ }
  }
  const issues = listIssues();
  const audience = await audienceCounts();

  const issueRows = await Promise.all(
    issues.map(async (i) => {
      let stats = "";
      if (i.sentAt && envStatus().db) {
        try {
          const s = await campaignStats(i.slug);
          const rate = (n) => (s.sends ? ` (${Math.round((n / s.sends) * 100)}%)` : "");
          stats = `${s.uniqueOpens}${rate(s.uniqueOpens)} opens · ${s.uniqueClicks}${rate(s.uniqueClicks)} clicks`;
        } catch { /* stats unavailable — leave blank */ }
      }
      const status = i.sentAt
        ? `<span class="badge sent">SENT ${esc(i.sentAt.slice(0, 10))}</span>`
        : i.sendAt
          ? `<span class="badge draft" title="Sends ${esc(i.sendAt)}">SCHEDULED ${esc(i.sendAt.slice(0, 16).replace("T", " "))}</span>`
          : `<span class="badge draft">DRAFT</span>`;
      const actions = i.sentAt
        ? `<a href="/report/${esc(i.slug)}">Report</a> · <a href="/edit/${esc(i.slug)}">View</a>`
        : `<a href="/edit/${esc(i.slug)}">Edit</a> · <a href="/send/${esc(i.slug)}">${i.sendAt ? "Scheduled…" : "Send…"}</a>`;
      return `<tr>
        <td><a href="/edit/${esc(i.slug)}" style="color:#ecedf6;font-weight:600">${esc(i.title || i.slug)}</a><div class="hint">${esc(i.slug)}</div></td>
        <td>${esc(i.date)}</td>
        <td>${status}</td>
        <td class="hint">${stats}</td>
        <td style="text-align:right;white-space:nowrap">${actions}</td>
      </tr>`;
    })
  );

  const audienceCard = audience
    ? `<div class="stat" style="border-bottom:1px solid #23232e;margin-bottom:10px"><div class="n">${audience.total}</div><div class="l">total unique subscribers</div></div>
       <table>${audience.lists
         .map((l) => `<tr><td>${esc(LISTS[l.list] ?? l.list)}</td><td class="hint">${esc(l.list)}</td><td style="text-align:right;font-weight:600">${l.count}</td></tr>`)
         .join("")}</table>
       <p style="margin:14px 0 0"><a href="/audience">Browse subscribers →</a></p>`
    : `<p class="hint">DATABASE_URL isn't set, so audience counts are unavailable. Add it to .env.local and restart the studio.</p>`;

  return layout(
    "Newsletter Studio",
    `<h1>Issues</h1>
     <p class="sub">Markdown files in <span style="font-family:monospace">content/newsletters/</span> — git is the version history.</p>
     <div class="grid">
       <div class="card">
         <table><tr><th>Issue</th><th>Date</th><th>Status</th><th>Engagement</th><th></th></tr>${issueRows.join("")}</table>
         <form method="post" action="/new" style="margin-top:16px;display:flex;gap:10px">
           <input type="text" name="title" placeholder="New issue title…" required style="flex:1" />
           <button type="submit">Create draft</button>
         </form>
       </div>
       <div class="card"><h2>Audience</h2>${audienceCard}</div>
     </div>`,
    { active: "/" }
  );
}

async function audiencePage(list, query) {
  if (!envStatus().db) {
    return layout("Audience", `<h1>Audience</h1><p class="hint">DATABASE_URL isn't set.</p>`, { active: "/audience" });
  }
  const audience = await audienceCounts();
  const rows = await subscribers(list, query);
  const listOptions = [`<option value="">All lists</option>`]
    .concat(
      (audience?.lists ?? []).map(
        (l) => `<option value="${esc(l.list)}" ${l.list === list ? "selected" : ""}>${esc(LISTS[l.list] ?? l.list)} (${l.count})</option>`
      )
    )
    .join("");
  return layout(
    "Audience",
    `<h1>Audience</h1>
     <p class="sub">${audience?.total ?? "?"} unique subscribers. Newest first; showing up to 200.</p>
     <div class="card">
       <form method="get" action="/audience" style="display:flex;gap:10px;margin-bottom:14px">
         <select name="list" onchange="this.form.submit()">${listOptions}</select>
         <input type="text" name="q" value="${esc(query ?? "")}" placeholder="Search email or name…" style="flex:1" />
         <button type="submit" class="secondary">Search</button>
       </form>
       <table><tr><th>Email</th><th>Name</th><th>List</th><th>Signed up</th></tr>
       ${rows
         .map(
           (r) =>
             `<tr><td>${esc(r.email)}</td><td>${esc(r.name ?? "")}</td><td class="hint">${esc(r.list)}</td><td class="hint">${esc(String(r.created_at).slice(0, 10))}</td></tr>`
         )
         .join("")}
       </table>
       <p class="hint" style="margin-top:12px">Removals happen via each email's one-click unsubscribe link — no manual delete here, so an accidental click can't silently drop a subscriber.</p>
     </div>`,
    { active: "/audience" }
  );
}

function editorPage(slug) {
  const issue = loadIssue(slug) ?? { title: "", date: new Date().toISOString().slice(0, 10), subject: "", body: "", sentAt: "" };
  const sentBanner = issue.sentAt
    ? `<span class="badge sent" style="margin-left:6px">SENT ${esc(issue.sentAt.slice(0, 10))} · ${esc(issue.sentCount)} to “${esc(issue.sentList)}”</span>`
    : "";
  const sendBtn = issue.sentAt
    ? `<a class="btn secondary" href="/report/${esc(slug)}">Report</a>`
    : `<a class="btn" href="/send/${esc(slug)}">Send…</a>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Edit: ${esc(slug)}</title><style>${STYLE}
  .split { display: grid; grid-template-columns: 1fr 1fr; height: calc(100vh - 49px); }
  .editor { padding: 20px; overflow-y: auto; border-right: 1px solid #23232e; }
  .preview { background: #f4f4f5; }
  .preview iframe { width: 100%; height: 100%; border: none; }
  textarea { width: 100%; height: 46vh; padding: 12px; background: #16161f; border: 1px solid #2a2a36; border-radius: 6px; color: #e5e5ea; font-size: 13px; font-family: ui-monospace,Menlo,monospace; line-height: 1.6; resize: vertical; }
  input[type=text] { width: 100%; }
  .toolbar { display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap; }
  .toolbar button { background: #16161f; border: 1px solid #2a2a36; color: #e5e5ea; padding: 5px 11px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .toolbar button:hover { border-color: #14b8a6; opacity: 1; }
  .dropzone { margin-top: 8px; border: 1.5px dashed #2a2a36; border-radius: 8px; padding: 14px; text-align: center; font-size: 12px; color: #7a7a85; cursor: pointer; }
  .dropzone.drag { border-color: #14b8a6; color: #14b8a6; }
  .testrow { display: flex; gap: 8px; margin-top: 14px; }
  .testrow input { flex: 1; }
  </style></head>
<body>
<header>
  <a href="/" class="brand" style="text-decoration:none">✦ Studio</a>
  <span style="font-family:monospace;font-size:13px;color:#7a7a85">/${esc(slug)}.md</span>${sentBanner}
  <button class="secondary" id="save">Save</button>
  ${sendBtn}
  <span class="chips" id="status" style="font-size:12px;color:#7a7a85"></span>
</header>
<div class="split">
  <div class="editor">
    <label>Title</label><input type="text" id="title" />
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
      <div><label>Date</label><input type="text" id="date" /></div>
      <div><label>Subject line <span id="subjLen" style="text-transform:none;letter-spacing:0"></span></label><input type="text" id="subject" /></div>
    </div>
    <label>Preview text (the gray line inboxes show after the subject — optional but valuable)</label>
    <input type="text" id="preheader" placeholder="e.g. Three SIGGRAPH talks, live classes are back, and what's cooking in the Lab" />
    <label>Body</label>
    <div class="toolbar">
      <button data-md="h2">H2</button>
      <button data-md="bold"><b>B</b></button>
      <button data-md="italic"><i>I</i></button>
      <button data-md="link">Link</button>
      <button data-md="bullet">• List</button>
      <button data-md="caption">Caption</button>
      <button data-md="hr">─ Rule</button>
    </div>
    <textarea id="body" spellcheck="true"></textarea>
    <div class="dropzone" id="dropzone">Drop image(s) here or click — auto-resized. Drop TWO together for a side-by-side row.</div>
    <div class="hint">Images land in public/newsletter/ and preview instantly. Commit &amp; push before the real send so the live site has them. A line of *just italic text* under an image renders as its caption.</div>
    <input type="file" id="fileInput" accept="image/*" multiple style="display:none" />
    <div class="testrow">
      <input type="email" id="testEmail" placeholder="you@example.com" value="info@agilelens.com" />
      <button class="secondary" id="testSend">Send test email</button>
    </div>
    <div class="hint">Test sends go ONLY to that address, with a [TEST] subject prefix. Save first — the test uses the saved file.</div>
    <div class="error-banner" id="errorBanner"></div>
  </div>
  <div class="preview"><iframe id="preview"></iframe></div>
</div>
<script>
  const SLUG = ${JSON.stringify(slug)};
  const $ = (id) => document.getElementById(id);
  const issue = ${JSON.stringify({ title: issue.title, date: issue.date, subject: issue.subject, preheader: issue.preheader ?? "", body: issue.body })};
  $('title').value = issue.title; $('date').value = issue.date; $('subject').value = issue.subject; $('preheader').value = issue.preheader; $('body').value = issue.body;
  let dirty = false;
  // Subject-length coach: ~50 chars is the mobile-safe zone.
  function subjLen() {
    const n = $('subject').value.length;
    $('subjLen').textContent = n ? '· ' + n + (n > 60 ? ' chars — will truncate on mobile' : n > 50 ? ' chars — long for mobile' : ' chars ✓') : '';
    $('subjLen').style.color = n > 60 ? '#ff8080' : n > 50 ? '#fbbf24' : '#5a5a65';
  }
  $('subject').addEventListener('input', subjLen); subjLen();
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function showError(msg) { const b = $('errorBanner'); b.textContent = msg; b.classList.add('show'); }
  function clearError() { $('errorBanner').classList.remove('show'); }
  function flash(msg) { $('status').textContent = msg; setTimeout(() => $('status').textContent = '', 4000); }

  let renderTimer;
  async function renderNow() {
    try {
      const res = await fetch('/render', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ body: $('body').value, preheader: $('preheader').value }) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const iframe = $('preview');
      // srcdoc swaps in a brand-new document every render, which resets
      // scroll to the top by default — jarring when you're mid-edit and
      // scrolled down to check something. Restore where you were.
      const prevScroll = iframe.contentWindow ? iframe.contentWindow.scrollY : 0;
      iframe.onload = () => { iframe.contentWindow.scrollTo(0, prevScroll); iframe.onload = null; };
      iframe.srcdoc = html;
    } catch (err) { showError('Preview failed: ' + err.message); }
  }
  function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderNow, 350); }
  $('body').addEventListener('input', () => { dirty = true; scheduleRender(); });
  ['title','date','subject','preheader'].forEach((id) => $(id).addEventListener('input', () => { dirty = true; }));
  renderNow();

  async function save() {
    clearError();
    $('status').textContent = 'Saving…';
    try {
      const res = await fetch('/save/' + SLUG, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title: $('title').value, date: $('date').value, subject: $('subject').value, preheader: $('preheader').value, body: $('body').value }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'HTTP ' + res.status); }
      dirty = false;
      flash('Saved ✓ ' + new Date().toLocaleTimeString());
      return true;
    } catch (err) { $('status').textContent = ''; showError('Save failed: ' + err.message); return false; }
  }
  $('save').addEventListener('click', save);
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });

  // Toolbar — wraps the selection (or inserts a template at the cursor).
  function applyMd(kind) {
    const ta = $('body');
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    let before = '', after = '', block = null;
    if (kind === 'bold') { before = '**'; after = '**'; }
    else if (kind === 'italic') { before = '*'; after = '*'; }
    else if (kind === 'h2') { block = '## ' + (sel || 'Heading'); }
    else if (kind === 'link') { before = '['; after = '](https://)'; }
    else if (kind === 'bullet') { block = '- ' + (sel || 'First point') + '\\n- Second point'; }
    else if (kind === 'caption') { block = '*' + (sel || 'Caption under the image above') + '*'; }
    else if (kind === 'hr') { block = '---'; }
    if (block !== null) {
      const pre = ta.value.slice(0, start), post = ta.value.slice(end);
      const glueA = pre && !pre.endsWith('\\n\\n') ? (pre.endsWith('\\n') ? '\\n' : '\\n\\n') : '';
      const glueB = post && !post.startsWith('\\n\\n') ? (post.startsWith('\\n') ? '\\n' : '\\n\\n') : '';
      ta.value = pre + glueA + block + glueB + post;
    } else {
      ta.value = ta.value.slice(0, start) + before + (sel || 'text') + after + ta.value.slice(end);
    }
    dirty = true; scheduleRender(); ta.focus();
  }
  document.querySelectorAll('.toolbar button').forEach((b) => b.addEventListener('click', () => applyMd(b.dataset.md)));

  // Image upload — client-side resize (long edge 1600px, JPEG 0.85), then
  // POST as data URL. Multiple files chosen together become ONE line → a
  // side-by-side row in the rendered email.
  const MAX_DIM = 1600;
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      if (/\\.(svg|gif)$/i.test(file.name)) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth, h = img.naturalHeight;
        if (w <= MAX_DIM && h <= MAX_DIM && file.size < 1500000) return resolve(file);
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob ? resolve(new File([blob], file.name.replace(/\\.[a-z0-9]+$/i, '.jpg'), { type: 'image/jpeg' })) : reject(new Error('Could not re-encode image')), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(file.name + ' — this browser cannot decode that format (HEIC?). Export as JPEG/PNG first.')); };
      img.src = url;
    });
  }
  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Could not read ' + file.name));
      r.readAsDataURL(file);
    });
  }
  async function uploadOne(file) {
    const resized = await resizeImage(file);
    const dataUrl = await readAsDataUrl(resized);
    const res = await fetch('/upload', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename: resized.name, dataUrl }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return { path: data.path, alt: file.name.replace(/\\.[a-z0-9]+$/i, '') };
  }
  async function uploadFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;
    clearError();
    $('status').textContent = 'Uploading ' + files.length + '…';
    try {
      const results = await Promise.all(files.map(uploadOne));
      const line = results.map((r) => '![' + r.alt + '](' + r.path + ')').join(' ');
      const ta = $('body');
      ta.value = ta.value + (ta.value.trim() ? '\\n\\n' : '') + line + '\\n';
      dirty = true;
      flash('Inserted ' + results.length + ' image' + (results.length > 1 ? 's' : ''));
      scheduleRender();
    } catch (err) { $('status').textContent = ''; showError('Upload failed: ' + err.message); }
  }
  const dz = $('dropzone');
  dz.addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => uploadFiles(e.target.files));
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); uploadFiles(e.dataTransfer.files); });

  $('testSend').addEventListener('click', async () => {
    clearError();
    if (dirty && !(await save())) return;
    const to = $('testEmail').value.trim();
    if (!to) return showError('Enter an address for the test send.');
    $('status').textContent = 'Sending test…';
    try {
      const res = await fetch('/test-send/' + SLUG, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ to }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'HTTP ' + res.status);
      flash('Test sent to ' + to + ' ✓');
    } catch (err) { $('status').textContent = ''; showError('Test send failed: ' + err.message); }
  });
</script>
</body></html>`;
}

async function sendPage(slug, err, notice) {
  const issue = loadIssue(slug);
  if (!issue) return null;
  if (issue.sentAt) {
    return layout("Already sent", `<h1>${esc(issue.title)}</h1><p class="sub">This issue was already sent ${esc(issue.sentAt)} to “${esc(issue.sentList)}” (${esc(issue.sentCount)} recipients). <a href="/report/${esc(slug)}">See the report →</a></p>`);
  }
  const s = envStatus();
  const audience = await audienceCounts();
  if (s.db && !audience) {
    return layout(
      `Send: ${issue.title}`,
      `<h1>Send “${esc(issue.title)}”</h1>
       <div class="error-banner show">Couldn't reach the audience database just now (transient network?). <a href="/send/${esc(slug)}">Retry →</a></div>`
    );
  }
  const counts = Object.fromEntries((audience?.lists ?? []).map((l) => [l.list, l.count]));
  const options = Object.entries(LISTS)
    .filter(([k]) => counts[k])
    .map(
      ([k, label]) => `<label style="display:flex;align-items:center;gap:10px;margin:8px 0;text-transform:none;letter-spacing:0;font-size:14px;color:#e5e5ea">
        <input type="checkbox" name="list" value="${esc(k)}" ${k === "newsletter" ? "checked" : ""} onchange="updateCount()" data-reason="${esc(LIST_REASON[k] ?? "")}" />
        ${esc(label)} <span class="hint">(${counts[k]} on this list)</span>
      </label>`
    )
    .join("");

  const scheduledBanner = issue.sendAt
    ? `<div class="card" style="border-color:#f59e0b66;margin-bottom:16px"><h2>Currently scheduled</h2>
       <p style="margin:0 0 10px">Sends <b style="color:#fbbf24">${esc(issue.sendAt)}</b> to “${esc(issue.sendLists)}”.</p>
       <form method="post" action="/unschedule/${esc(slug)}"><button class="secondary">Cancel this schedule</button></form>
       <p class="hint" style="margin-top:8px">Cancelling pushes to main too — it must deploy before the send time to take effect.</p></div>`
    : "";

  const blockers = [];
  if (!s.db) blockers.push("DATABASE_URL is missing — can't load recipients.");
  if (!s.resend) blockers.push("RESEND_API_KEY is missing — can't send email now. (Scheduling still works: the PRODUCTION key does the sending.)");
  if (!s.auth) blockers.push("AUTH_SECRET is missing — can't build unsubscribe links locally. (Scheduled sends use production's.)");
  const canSchedule = s.db; // schedule needs counts only; prod has the rest

  // Default schedule suggestion: tomorrow 10:00 local.
  const t = new Date(Date.now() + 24 * 3600 * 1000);
  const defaultWhen = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}T10:00`;

  return layout(
    `Send: ${issue.title}`,
    `<h1>Send “${esc(issue.title)}”</h1>
     <p class="sub">Subject: <b style="color:#ecedf6">${esc(issue.subject || issue.title)}</b> · <a href="/edit/${esc(slug)}">back to editor</a></p>
     ${err ? `<div class="error-banner show" style="margin-bottom:16px">${esc(err)}</div>` : ""}
     ${notice ? `<div class="card" style="border-color:#14b8a666;margin-bottom:16px"><p style="margin:0;color:#14b8a6">${esc(notice)}</p></div>` : ""}
     ${scheduledBanner}
     ${!s.db ? `<div class="card" style="border-color:#7a2a2a"><h2>Not ready</h2><p class="hint" style="color:#ff8080">${esc(blockers[0])}</p></div>` : `
     <form method="post" class="card" id="sendForm">
       <h2>1 · Choose the audience — several lists combine, duplicates collapse</h2>
       ${options}
       <p class="hint">Combined unique recipients: <b id="countLabel" style="color:#fbbf24">…</b></p>
       <h2 style="margin-top:20px">2 · The footer every recipient sees</h2>
       <p class="hint" id="footerPreview" style="font-family:monospace"></p>
       <label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:#e5e5ea;margin-top:8px">
         <input type="checkbox" name="broad" checked /> Include “Future newsletters will be more tailored to the specific list you signed up for.”
       </label>
       <h2 style="margin-top:20px">3 · Confirm</h2>
       <p class="hint">Type the exact combined count to arm either button. This emails real people — there is no undo.</p>
       <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;align-items:center">
         <input type="text" name="confirmCount" placeholder="recipient count" autocomplete="off" />
         ${s.resend && s.auth ? `<button type="submit" class="danger" formaction="/send/${esc(slug)}">Send now to <span id="btnCount">…</span></button>` : `<span class="hint">(“Send now” unavailable without local keys — use Schedule)</span>`}
         ${canSchedule ? `<span class="hint" style="margin:0 4px">or</span>
         <input type="datetime-local" name="when" value="${defaultWhen}" style="padding:8px 10px;background:#16161f;border:1px solid #2a2a36;border-radius:6px;color:#e5e5ea" />
         <button type="submit" formaction="/schedule/${esc(slug)}">Schedule</button>` : ""}
       </div>
       <p class="hint" style="margin-top:10px">Scheduling saves the time into the issue, pushes it (and its images) to main, and production sends it at the chosen time — your laptop can be closed. Runs on a 15-minute check, so times land within ~15 min.</p>
     </form>`}
     <script>
       let currentCount = null;
       async function updateCount() {
         const picked = Array.from(document.querySelectorAll('input[name=list]:checked'));
         const lists = picked.map((r) => r.value);
         const lbl = document.getElementById('countLabel');
         const btn = document.getElementById('btnCount');
         if (!lists.length) { currentCount = null; lbl.textContent = '0 — pick a list'; if (btn) btn.textContent = '0'; return; }
         lbl.textContent = '…';
         try {
           const res = await fetch('/count?lists=' + encodeURIComponent(lists.join(',')));
           const d = await res.json();
           currentCount = String(d.count);
           lbl.textContent = currentCount;
           if (btn) btn.textContent = currentCount + ' people';
         } catch { lbl.textContent = 'count failed — retry'; currentCount = null; }
         const reason = picked.length === 1 ? picked[0].dataset.reason : ${JSON.stringify(LIST_REASON.newsletter)};
         document.getElementById('footerPreview').textContent = "You're receiving this newsletter because " + reason + ". … To unsubscribe from this list, click here.";
       }
       document.getElementById('sendForm')?.addEventListener('submit', (e) => {
         const f = e.target;
         if (currentCount === null || f.confirmCount.value.trim() !== currentCount) {
           e.preventDefault();
           alert('Type the exact combined recipient count (' + (currentCount ?? '?') + ') to confirm.');
         }
       });
       updateCount();
     </script>`
  );
}

async function reportPage(slug, celebrate) {
  const issue = loadIssue(slug);
  if (!issue) return null;
  // A real send is a real moment — 421 people just heard from you.
  const confetti = celebrate
    ? `<div id="confetti" style="pointer-events:none;position:fixed;inset:0;overflow:hidden;z-index:50"></div>
       <div class="card" style="border-color:#14b8a666;margin-bottom:16px;text-align:center">
         <p style="margin:0;font-size:18px">🎉 <b>It's out.</b> ${esc(issue.sentCount)} inboxes are about to hear from you.</p>
         <p class="hint" style="margin-top:6px">Opens and clicks will start trickling in below — this page refreshes itself.</p>
       </div>
       <script>
         const box = document.getElementById('confetti');
         const bits = ['✦','✧','🎉','⬡','●'];
         const colors = ['#2dd4bf','#a78bfa','#fbbf24','#14b8a6','#ecedf6'];
         for (let i = 0; i < 80; i++) {
           const s = document.createElement('span');
           s.textContent = bits[i % bits.length];
           s.style.cssText = 'position:absolute;top:-30px;font-size:' + (10 + Math.floor(i % 5) * 4) + 'px;'
             + 'left:' + ((i * 37) % 100) + 'vw;color:' + colors[i % colors.length] + ';'
             + 'animation:fall ' + (2.5 + (i % 10) / 4) + 's linear ' + ((i % 20) / 10) + 's forwards';
           box.appendChild(s);
         }
         const st = document.createElement('style');
         st.textContent = '@keyframes fall { to { transform: translateY(110vh) rotate(' + 360 + 'deg); opacity: 0.2 } }';
         document.head.appendChild(st);
         setTimeout(() => box.remove(), 7000);
       </script>`
    : "";
  let statsHtml = `<p class="hint">DATABASE_URL isn't set — stats unavailable.</p>`;
  if (envStatus().db) {
    try {
      const st = await campaignStats(slug);
      const pct = (n) => (st.sends ? `${Math.round((n / st.sends) * 100)}%` : "—");
      statsHtml = `
        <div class="statrow">
          <div class="stat"><div class="n">${st.sends}</div><div class="l">delivered</div></div>
          <div class="stat"><div class="n">${st.uniqueOpens}</div><div class="l">unique opens · ${pct(st.uniqueOpens)}</div></div>
          <div class="stat"><div class="n">${st.uniqueClicks}</div><div class="l">unique clickers · ${pct(st.uniqueClicks)}</div></div>
          <div class="stat"><div class="n">${st.clicks}</div><div class="l">total clicks</div></div>
          <div class="stat"><div class="n">${st.unsubs}</div><div class="l">unsubscribes</div></div>
        </div>
        ${st.topLinks.length ? `<h2 style="margin-top:22px">Top links</h2><table><tr><th>URL</th><th style="text-align:right">Clicks</th></tr>${st.topLinks.map((l) => `<tr><td style="word-break:break-all">${esc(l.url)}</td><td style="text-align:right;font-weight:600">${l.clicks}</td></tr>`).join("")}</table>` : ""}
        <p class="hint" style="margin-top:16px">Opens undercount reality (image-blocking clients never fire the pixel; Apple Mail privacy inflates it the other way). Treat trends, not absolutes.</p>`;
    } catch (err) {
      statsHtml = `<p class="hint">Stats query failed: ${esc(err.message)}</p>`;
    }
  }
  const sentLine = issue.sentAt
    ? `Sent ${esc(issue.sentAt)} to “${esc(issue.sentList)}” — ${esc(issue.sentCount)} recipients.`
    : "Not sent yet.";
  return layout(
    `Report: ${issue.title}`,
    `${confetti}<h1>${esc(issue.title)}</h1>
     <p class="sub">${sentLine} · <a href="/edit/${esc(slug)}">view content</a> · auto-refreshes every 60s</p>
     <div class="card">${statsHtml}</div>
     <script>setTimeout(() => location.href = location.pathname, 60000)</script>`
  );
}

// ── Upload / misc helpers ───────────────────────────────────────────────────

const IMAGE_CONTENT_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
};

function safeFilename(name) {
  const ext = path.extname(name).toLowerCase() || ".jpg";
  const base = path.basename(name, path.extname(name)).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  let candidate = `${base}${ext}`;
  let n = 1;
  while (existsSync(path.join(IMAGE_DIR, candidate))) candidate = `${base}-${n++}${ext}`;
  return candidate;
}

function slugify(title) {
  const date = new Date().toISOString().slice(0, 10);
  const s = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "issue";
  let slug = `${date}-${s}`;
  let n = 1;
  while (existsSync(path.join(NEWSLETTER_DIR, `${slug}.md`))) slug = `${date}-${s}-${n++}`;
  return slug;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function renderPreview(body, preheader) {
  const footerHtml = `You&rsquo;re receiving this newsletter because ${LIST_REASON.newsletter}. Future newsletters will be more tailored to the specific list you signed up for. <a href="#" style="color:#888">To unsubscribe from this list, click here.</a>`;
  return renderNewsletterEmail({ bodyMarkdown: body, footerHtml, siteUrl: `http://localhost:${PORT}`, preheader });
}

// ── Server ──────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const sendHtml = (html, code = 200) => { res.writeHead(code, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); };
  const sendJson = (obj, code = 200) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
  const redirect = (to) => { res.writeHead(303, { Location: to }); res.end(); };

  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;

    if (req.method === "GET" && p === "/") return sendHtml(await dashboardPage());
    if (req.method === "GET" && p === "/audience") return sendHtml(await audiencePage(url.searchParams.get("list") || undefined, url.searchParams.get("q") || undefined));
    if (req.method === "GET" && p.startsWith("/edit/")) {
      const slug = decodeURIComponent(p.slice("/edit/".length));
      return sendHtml(editorPage(slug));
    }
    if (req.method === "GET" && p.startsWith("/send/")) {
      const page = await sendPage(
        decodeURIComponent(p.slice("/send/".length)),
        url.searchParams.get("err") || undefined,
        url.searchParams.get("notice") || undefined
      );
      return page ? sendHtml(page) : sendHtml("Not found", 404);
    }
    if (req.method === "GET" && p.startsWith("/report/")) {
      const page = await reportPage(decodeURIComponent(p.slice("/report/".length)), url.searchParams.get("sent") === "1");
      return page ? sendHtml(page) : sendHtml("Not found", 404);
    }
    if (req.method === "GET" && p.startsWith("/newsletter/")) {
      const filename = decodeURIComponent(p.slice("/newsletter/".length));
      const filePath = path.join(IMAGE_DIR, filename);
      if (!filePath.startsWith(IMAGE_DIR) || !existsSync(filePath)) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "Content-Type": IMAGE_CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream" });
      return res.end(readFileSync(filePath));
    }

    if (req.method === "GET" && p === "/count") {
      const lists = (url.searchParams.get("lists") ?? "").split(",").map((s) => s.trim()).filter(isListSlug);
      const emails = await listRecipients(lists);
      return sendJson({ count: emails.length });
    }
    if (req.method === "POST" && p === "/new") {
      const params = new URLSearchParams((await readBody(req)).toString("utf8"));
      const title = (params.get("title") ?? "").trim() || "New issue";
      const slug = slugify(title);
      saveIssue(slug, { title, date: new Date().toISOString().slice(0, 10), subject: title, body: "Hey — Alex here.\n\n" });
      return redirect(`/edit/${slug}`);
    }
    if (req.method === "POST" && p === "/render") {
      const raw = (await readBody(req)).toString("utf8");
      // JSON {body, preheader} from the current editor; plain text kept for
      // backward compatibility with anything older.
      try {
        const d = JSON.parse(raw);
        return sendHtml(renderPreview(d.body ?? "", d.preheader || undefined));
      } catch {
        return sendHtml(renderPreview(raw));
      }
    }
    if (req.method === "POST" && p.startsWith("/save/")) {
      const slug = decodeURIComponent(p.slice("/save/".length));
      saveIssue(slug, JSON.parse((await readBody(req)).toString("utf8")));
      return sendJson({ ok: true });
    }
    if (req.method === "POST" && p === "/upload") {
      const { filename, dataUrl } = JSON.parse((await readBody(req)).toString("utf8"));
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Bad image data");
      const buf = Buffer.from(match[2], "base64");
      if (buf.length > 10_000_000) throw new Error(`${filename} is ${(buf.length / 1_000_000).toFixed(1)}MB even after resize — too large for an email`);
      const saved = safeFilename(filename);
      writeFileSync(path.join(IMAGE_DIR, saved), buf);
      return sendJson({ path: `/newsletter/${saved}` });
    }
    if (req.method === "POST" && p.startsWith("/test-send/")) {
      const slug = decodeURIComponent(p.slice("/test-send/".length));
      const issue = loadIssue(slug);
      if (!issue) return sendJson({ error: "No such issue" }, 404);
      const { to } = JSON.parse((await readBody(req)).toString("utf8"));
      if (!to || !to.includes("@")) return sendJson({ error: "Enter a valid email address" }, 400);

      // No local Resend key? Production can send the test instead — the
      // cron route's ?test= mode uses prod's own keys. Requires the issue
      // to be DEPLOYED (it reads the deployed markdown), so warn when the
      // local draft differs from what's live.
      if (!process.env.RESEND_API_KEY && process.env.CRON_SECRET) {
        const res = await fetch(
          `${SITE_URL}/api/cron/send-newsletter?test=${encodeURIComponent(to)}&slug=${encodeURIComponent(slug)}`,
          { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }
        );
        const d = await res.json().catch(() => ({}));
        if (!res.ok) return sendJson({ error: d.error ?? `production test-send failed (HTTP ${res.status})` }, 502);
        return sendJson({ ok: true, sent: d.sent, viaProduction: true });
      }

      const result = await sendCampaign({
        campaign: slug,
        subject: issue.subject || issue.title,
        bodyMarkdown: issue.body,
        list: "newsletter",
        reason: LIST_REASON.newsletter,
        broad: true,
        webUrl: `${SITE_URL}/newsletter/${slug}`,
        preheader: issue.preheader || undefined,
        testTo: [to],
      });
      if (result.errors.length) return sendJson({ error: result.errors.join("; ") }, 502);
      return sendJson({ ok: true, sent: result.sent });
    }
    if (req.method === "POST" && (p.startsWith("/send/") || p.startsWith("/schedule/"))) {
      const scheduling = p.startsWith("/schedule/");
      const slug = decodeURIComponent(p.slice((scheduling ? "/schedule/" : "/send/").length));
      const issue = loadIssue(slug);
      if (!issue) return sendHtml("Not found", 404);
      if (issue.sentAt) return redirect(`/report/${slug}`);
      const params = new URLSearchParams((await readBody(req)).toString("utf8"));
      const lists = params.getAll("list").filter(isListSlug);
      const broad = params.get("broad") !== null;
      const confirm = (params.get("confirmCount") ?? "").trim();
      const fail = (msg) => redirect(`/send/${slug}?err=${encodeURIComponent(msg)}`);
      if (!lists.length) return fail("Pick at least one list.");
      // Server-side re-verify: the typed count must match the union RIGHT NOW.
      const recipients = await listRecipients(lists);
      if (confirm !== String(recipients.length)) {
        return fail(`Confirmation mismatch: the selected lists combine to ${recipients.length} unique recipients right now — type exactly that.`);
      }
      const reason = lists.length === 1 ? LIST_REASON[lists[0]] : LIST_REASON.newsletter;

      if (scheduling) {
        const when = params.get("when");
        const at = when ? new Date(when) : null; // datetime-local → local time
        if (!at || Number.isNaN(at.getTime())) return fail("Pick a valid date and time.");
        if (at.getTime() < Date.now() + 10 * 60 * 1000) return fail("Schedule at least 10 minutes out — the cron checks every 15.");
        markScheduled(slug, { sendAt: at.toISOString(), sendLists: lists.join(","), sendBroad: broad ? "1" : "0" });
        try {
          gitPublish(slug, `newsletter: schedule "${slug}" for ${at.toISOString()} → ${lists.join(",")}`);
        } catch (err) {
          clearSchedule(slug);
          return fail(`Could not publish the schedule to main (nothing scheduled): ${err.message}`);
        }
        console.log(`[studio] scheduled "${slug}" for ${at.toISOString()} → ${lists.join(",")}`);
        return redirect(`/send/${slug}?notice=${encodeURIComponent(`Scheduled for ${at.toLocaleString()} and pushed to main — production sends it (±15 min). Cancel any time before then.`)}`);
      }

      // Immediate send. Claim first — the same claim the cron takes — so a
      // scheduled send and a manual send of the same issue can never race.
      const claimed = await claimCampaignSend(slug, lists);
      if (!claimed) return fail("This campaign already has a send claim (sent or in flight). Check the report.");
      console.log(`[studio] SENDING "${slug}" to ${lists.join(",")} (${recipients.length} recipients)…`);
      let result;
      try {
        result = await sendCampaign({
          campaign: slug,
          subject: issue.subject || issue.title,
          bodyMarkdown: issue.body,
          list: lists,
          reason,
          broad,
          webUrl: `${SITE_URL}/newsletter/${slug}`,
          preheader: issue.preheader || undefined,
          onProgress: (sent, total) => console.log(`[studio]   ${sent}/${total}`),
        });
      } catch (err) {
        console.error(`[studio] send failed before any email went out:`, err.message);
        await completeCampaignSend(slug, { sent: 0, recipients: 0, errors: [err.message] });
        return fail("Send failed: " + err.message);
      }
      await completeCampaignSend(slug, result);
      appendFileSync(SEND_LOG, JSON.stringify({ slug, lists, at: new Date().toISOString(), ...result }) + "\n");
      if (result.sent > 0) markSent(slug, lists, result.sent);
      console.log(`[studio] done: ${result.sent}/${result.recipients} sent${result.errors.length ? `, errors: ${result.errors.join("; ")}` : ""}`);
      if (result.errors.length && result.sent === 0) {
        return fail("Send failed: " + result.errors.join("; "));
      }
      return redirect(`/report/${slug}?sent=1`);
    }
    if (req.method === "POST" && p.startsWith("/unschedule/")) {
      const slug = decodeURIComponent(p.slice("/unschedule/".length));
      if (!loadIssue(slug)) return sendHtml("Not found", 404);
      clearSchedule(slug);
      try {
        gitPublish(slug, `newsletter: cancel scheduled send of "${slug}"`);
      } catch (err) {
        return redirect(`/send/${slug}?err=${encodeURIComponent(`Cancelled locally but the push to main FAILED — the deployed schedule may still fire: ${err.message}`)}`);
      }
      return redirect(`/send/${slug}?notice=${encodeURIComponent("Schedule cancelled and pushed to main.")}`);
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (err) {
    console.error("[studio]", err);
    if (!res.headersSent) sendJson({ error: err.message }, 500);
  }
});

// 127.0.0.1 only — never reachable from the network, even accidentally.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is busy (an old editor still running?).`);
    console.error(`Kill it, or run: STUDIO_PORT=${PORT + 1} npm run studio`);
    process.exit(1);
  }
  throw err;
});
server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`✦ Newsletter Studio — ${url}`);
  console.log("Ctrl+C to stop.");
  try {
    execSync(`open "${url}"`);
  } catch {
    console.log(`Open manually: ${url}`);
  }
});
