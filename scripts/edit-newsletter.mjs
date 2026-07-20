#!/usr/bin/env node
/**
 * A real local editor for newsletter issues — text fields, an image
 * uploader, and a live preview, all in one page. No login, no deploy: it's
 * a tiny local-only server (binds to 127.0.0.1, never reachable from the
 * network) that writes straight to content/newsletters/*.md and
 * public/newsletter/*.
 *
 * Usage:
 *   node scripts/edit-newsletter.mjs                                  # latest issue
 *   node scripts/edit-newsletter.mjs 2026-07-16-siggraph-and-august-cohort
 *   node scripts/edit-newsletter.mjs 2026-08-01-new-issue              # creates it
 *
 * Opens automatically in your default browser. Ctrl+C in the terminal to
 * stop the server when you're done.
 */
import { createServer } from "node:http";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNewsletterEmail } from "../lib/newsletterEmail.ts";
import { LIST_REASON } from "../lib/lists.ts";

// Resolved from this file's own location, NOT process.cwd() — so the script
// works no matter what directory you run it from (e.g. `node
// /Users/alex/GH/alexcoulombepresents/scripts/edit-newsletter.mjs` from
// your home folder still finds the right project files).
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NEWSLETTER_DIR = path.join(ROOT, "content", "newsletters");
const IMAGE_DIR = path.join(ROOT, "public", "newsletter");
const PORT = 4848;

mkdirSync(IMAGE_DIR, { recursive: true });

function listSlugs() {
  return readdirSync(NEWSLETTER_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort()
    .reverse();
}

function slugArg() {
  const arg = process.argv[2];
  if (arg) return arg;
  const existing = listSlugs();
  return existing[0] ?? new Date().toISOString().slice(0, 10) + "-new-issue";
}

const slug = slugArg();
const filePath = path.join(NEWSLETTER_DIR, `${slug}.md`);

function loadIssue() {
  if (!existsSync(filePath)) {
    return { title: "", date: new Date().toISOString().slice(0, 10), subject: "", body: "" };
  }
  const raw = readFileSync(filePath, "utf8");
  const [header, ...rest] = raw.split(/^---$/m);
  const get = (key) => header.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
  return { title: get("title"), date: get("date"), subject: get("subject"), body: rest.join("---").trim() };
}

function saveIssue({ title, date, subject, body }) {
  const content = `title: ${title}\ndate: ${date}\nsubject: ${subject}\n---\n${body.trim()}\n`;
  writeFileSync(filePath, content);
}

function renderPreview(body) {
  const footerHtml = `You&rsquo;re receiving this newsletter because ${LIST_REASON.newsletter}. Future newsletters will be more tailored to the specific list you signed up for. <a href="#" style="color:#888">To unsubscribe from this list, click here.</a>`;
  // siteUrl points at THIS server (not the live site) so an image you just
  // uploaded shows up immediately — no deploy needed to preview it. The
  // real send (scripts/broadcast.mjs) always uses the real site URL, since
  // that's what recipients' inboxes actually need to fetch.
  return renderNewsletterEmail({ bodyMarkdown: body, footerHtml, siteUrl: `http://localhost:${PORT}` });
}

const IMAGE_CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function safeFilename(name) {
  const ext = path.extname(name).toLowerCase() || ".jpg";
  const base = path.basename(name, path.extname(name)).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  let candidate = `${base}${ext}`;
  let n = 1;
  while (existsSync(path.join(IMAGE_DIR, candidate))) {
    candidate = `${base}-${n++}${ext}`;
  }
  return candidate;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const PAGE = /* html */ `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Editing: ${slug}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: #0a0a12; color: #e5e5ea; }
  header { padding: 14px 20px; border-bottom: 1px solid #23232e; display: flex; align-items: center; gap: 16px; }
  header h1 { font-size: 14px; font-weight: 600; margin: 0; font-family: monospace; color: #14b8a6; }
  header .status { font-size: 12px; color: #7a7a85; margin-left: auto; }
  main { display: grid; grid-template-columns: 1fr 1fr; height: calc(100vh - 49px); }
  .editor { padding: 20px; overflow-y: auto; border-right: 1px solid #23232e; }
  .preview { background: #f4f4f5; }
  .preview iframe { width: 100%; height: 100%; border: none; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #7a7a85; margin: 14px 0 5px; }
  label:first-child { margin-top: 0; }
  input[type=text] { width: 100%; padding: 9px 11px; background: #16161f; border: 1px solid #2a2a36; border-radius: 6px; color: #e5e5ea; font-size: 14px; }
  textarea { width: 100%; height: 420px; padding: 12px; background: #16161f; border: 1px solid #2a2a36; border-radius: 6px; color: #e5e5ea; font-size: 13px; font-family: ui-monospace,Menlo,monospace; line-height: 1.6; resize: vertical; }
  .row { display: flex; gap: 10px; align-items: center; }
  button { background: #14b8a6; color: #0a0a12; border: none; padding: 9px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
  button:hover { opacity: 0.9; }
  button.secondary { background: transparent; border: 1px solid #2a2a36; color: #e5e5ea; }
  .dropzone { margin-top: 8px; border: 1.5px dashed #2a2a36; border-radius: 8px; padding: 16px; text-align: center; font-size: 12px; color: #7a7a85; cursor: pointer; }
  .dropzone.drag { border-color: #14b8a6; color: #14b8a6; }
  .hint { font-size: 11px; color: #5a5a65; margin-top: 6px; }
</style>
</head>
<body>
<header>
  <h1>/${slug}.md</h1>
  <button class="secondary" id="save">Save</button>
  <span class="status" id="status"></span>
</header>
<main>
  <div class="editor">
    <label>Title</label>
    <input type="text" id="title" />
    <label>Date</label>
    <input type="text" id="date" />
    <label>Subject (the email subject line)</label>
    <input type="text" id="subject" />
    <label>Body (markdown — ## heading, **bold**, [link](url), ![alt](url), - bullets)</label>
    <textarea id="body" spellcheck="true"></textarea>
    <div class="dropzone" id="dropzone">Drop an image here, or click to choose a file — inserts at the end of the body</div>
    <div class="hint">Images save into public/newsletter/ and preview here immediately. Before the real send, they need to be committed &amp; pushed so the live site actually has them too.</div>
    <input type="file" id="fileInput" accept="image/*" style="display:none" />
  </div>
  <div class="preview"><iframe id="preview"></iframe></div>
</main>
<script>
  const $ = (id) => document.getElementById(id);
  const issue = ${JSON.stringify(loadIssue())};
  $('title').value = issue.title;
  $('date').value = issue.date;
  $('subject').value = issue.subject;
  $('body').value = issue.body;

  let renderTimer;
  async function renderNow() {
    const res = await fetch('/render', { method: 'POST', headers: {'Content-Type':'text/plain'}, body: $('body').value });
    const html = await res.text();
    $('preview').srcdoc = html;
  }
  function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderNow, 350); }
  $('body').addEventListener('input', scheduleRender);
  renderNow();

  $('save').addEventListener('click', async () => {
    $('status').textContent = 'Saving…';
    const res = await fetch('/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title: $('title').value, date: $('date').value, subject: $('subject').value, body: $('body').value }),
    });
    $('status').textContent = res.ok ? 'Saved ✓ — ' + new Date().toLocaleTimeString() : 'Save failed';
    setTimeout(() => $('status').textContent = '', 4000);
  });

  async function uploadFile(file) {
    $('status').textContent = 'Uploading ' + file.name + '…';
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch('/upload', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ filename: file.name, dataUrl: reader.result }),
      });
      const { path: imgPath } = await res.json();
      const ta = $('body');
      const insert = (ta.value.trim() ? '\\n\\n' : '') + '![' + file.name.replace(/\\.[a-z0-9]+$/i, '') + '](' + imgPath + ')\\n';
      ta.value = ta.value + insert;
      $('status').textContent = 'Inserted ' + imgPath;
      scheduleRender();
      setTimeout(() => $('status').textContent = '', 4000);
    };
    reader.readAsDataURL(file);
  }

  const dz = $('dropzone');
  dz.addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => { if (e.target.files[0]) uploadFile(e.target.files[0]); });
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault(); dz.classList.remove('drag');
    if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  });
</script>
</body>
</html>`;

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(PAGE);
    } else if (req.method === "GET" && req.url.startsWith("/newsletter/")) {
      // Serves whatever's actually on disk in public/newsletter/ — so an
      // uploaded-but-not-yet-deployed image renders correctly in preview.
      const filename = decodeURIComponent(req.url.slice("/newsletter/".length));
      const filePath = path.join(IMAGE_DIR, filename);
      if (!filePath.startsWith(IMAGE_DIR) || !existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const type = IMAGE_CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      res.end(readFileSync(filePath));
    } else if (req.method === "POST" && req.url === "/render") {
      const body = (await readBody(req)).toString("utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderPreview(body));
    } else if (req.method === "POST" && req.url === "/save") {
      const data = JSON.parse((await readBody(req)).toString("utf8"));
      saveIssue(data);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } else if (req.method === "POST" && req.url === "/upload") {
      const { filename, dataUrl } = JSON.parse((await readBody(req)).toString("utf8"));
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Bad image data");
      const buf = Buffer.from(match[2], "base64");
      const saved = safeFilename(filename);
      writeFileSync(path.join(IMAGE_DIR, saved), buf);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ path: `/newsletter/${saved}` }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// 127.0.0.1 only — never reachable from the network, even accidentally.
server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Editing "${slug}" — ${url}`);
  console.log("Ctrl+C to stop.");
  try {
    execSync(`open "${url}"`);
  } catch {
    console.log(`Open manually: ${url}`);
  }
});
