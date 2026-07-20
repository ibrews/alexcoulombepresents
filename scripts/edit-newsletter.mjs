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
  .error-banner { display: none; margin-top: 10px; padding: 10px 12px; background: #3a1a1a; border: 1px solid #7a2a2a; border-radius: 6px; color: #ff8080; font-size: 12px; line-height: 1.5; }
  .error-banner.show { display: block; }
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
    <label>Body (markdown — ## heading, **bold**, *italic*, [link](url), ![alt](url), - bullets. A line of *just italic text* right after an image/row becomes a centered caption)</label>
    <textarea id="body" spellcheck="true"></textarea>
    <div class="dropzone" id="dropzone">Drop image(s) here, or click to choose — large photos are auto-resized. Drop/select TWO at once for a side-by-side row.</div>
    <div class="hint">Images save into public/newsletter/ and preview here immediately. Before the real send, they need to be committed &amp; pushed so the live site actually has them too.</div>
    <input type="file" id="fileInput" accept="image/*" multiple style="display:none" />
    <div class="error-banner" id="errorBanner"></div>
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

  function showError(msg) {
    const b = $('errorBanner');
    b.textContent = msg;
    b.classList.add('show');
  }
  function clearError() { $('errorBanner').classList.remove('show'); }

  let renderTimer;
  async function renderNow() {
    try {
      const res = await fetch('/render', { method: 'POST', headers: {'Content-Type':'text/plain'}, body: $('body').value });
      if (!res.ok) throw new Error('Preview render failed (HTTP ' + res.status + ')');
      $('preview').srcdoc = await res.text();
    } catch (err) {
      showError('Preview failed: ' + err.message);
    }
  }
  function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderNow, 350); }
  $('body').addEventListener('input', scheduleRender);
  renderNow();

  $('save').addEventListener('click', async () => {
    clearError();
    $('status').textContent = 'Saving…';
    try {
      const res = await fetch('/save', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title: $('title').value, date: $('date').value, subject: $('subject').value, body: $('body').value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'HTTP ' + res.status);
      }
      $('status').textContent = 'Saved ✓ — ' + new Date().toLocaleTimeString();
    } catch (err) {
      $('status').textContent = '';
      showError('Save failed: ' + err.message);
    }
    setTimeout(() => $('status').textContent = '', 4000);
  });

  // Long edge capped at 1600px (plenty for a 600px-wide email — this is
  // 2.6x that for retina) and re-encoded as JPEG at 0.85 quality. A typical
  // 20-40MB phone photo becomes a few hundred KB, which is what actually
  // fixes "uploads that don't seem to do anything" — the old code built a
  // many-MB base64 JSON string on the main thread with zero feedback while
  // it worked, which looks identical to broken. SVGs and GIFs pass through
  // unresized (vector / animation would break under a canvas re-encode).
  const MAX_DIM = 1600;
  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      if (/\\.(svg|gif)$/i.test(file.name)) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { naturalWidth: w, naturalHeight: h } = img;
        if (w <= MAX_DIM && h <= MAX_DIM && file.size < 1_500_000) return resolve(file);
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob ? resolve(new File([blob], file.name.replace(/\\.[a-z0-9]+$/i, '.jpg'), { type: 'image/jpeg' })) : reject(new Error('Could not re-encode image')),
          'image/jpeg', 0.85
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(file.name + ' — this browser cannot decode that image format (common with HEIC photos on non-Safari browsers). Try exporting it as JPEG or PNG first.')); };
      img.src = url;
    });
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read ' + file.name));
      reader.readAsDataURL(file);
    });
  }

  async function uploadOne(file) {
    const resized = await resizeImage(file);
    const dataUrl = await readAsDataUrl(resized);
    const res = await fetch('/upload', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ filename: resized.name, dataUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return { path: data.path, alt: file.name.replace(/\\.[a-z0-9]+$/i, '') };
  }

  // Two or more files dropped/selected TOGETHER become one combined line —
  // that's what renders as a side-by-side row (see lib/newsletterEmail.ts).
  async function uploadFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    clearError();
    $('status').textContent = 'Uploading ' + files.length + ' image' + (files.length > 1 ? 's' : '') + '…';
    try {
      const results = await Promise.all(files.map(uploadOne));
      const line = results.map((r) => '![' + r.alt + '](' + r.path + ')').join(' ');
      const ta = $('body');
      ta.value = ta.value + (ta.value.trim() ? '\\n\\n' : '') + line + '\\n';
      $('status').textContent = 'Inserted ' + results.length + ' image' + (results.length > 1 ? 's' : '');
      scheduleRender();
    } catch (err) {
      $('status').textContent = '';
      showError('Upload failed: ' + err.message);
    }
    setTimeout(() => $('status').textContent = '', 4000);
  }

  const dz = $('dropzone');
  dz.addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => uploadFiles(e.target.files));
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault(); dz.classList.remove('drag');
    uploadFiles(e.dataTransfer.files);
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
      // Backstop for the client-side resize (svg/gif skip it deliberately,
      // and it could fail open in a browser edge case) — a clear error
      // beats a silent multi-MB write nobody asked for.
      if (buf.length > 10_000_000) {
        throw new Error(`${filename} is ${(buf.length / 1_000_000).toFixed(1)}MB even after resize — too large to use in an email`);
      }
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
