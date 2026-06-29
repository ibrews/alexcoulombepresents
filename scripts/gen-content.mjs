// ─────────────────────────────────────────────────────────────────────────────
// gen-content.mjs — extract every piece of human-facing copy on the site into a
// single editable document (CONTENT.md) plus a machine snapshot (content/strings.
// snapshot.json) used to diff edits back into source.
//
//   node scripts/gen-content.mjs
//
// Two sources of text:
//   1. Catalogs — lib/data.ts + lib/store.ts (imported directly; exact).
//   2. Page prose — app/**/page.tsx JSX text (parsed via the TS compiler AST).
//
// Nothing here writes to the app. It only reads source and (re)writes CONTENT.md
// and the snapshot. Safe to run anytime.
// ─────────────────────────────────────────────────────────────────────────────
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => path.relative(root, p);

// ── helpers ──────────────────────────────────────────────────────────────────
const ENTITIES = { "&apos;": "'", "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&mdash;": "—", "&nbsp;": " " };
const decode = (s) => s.replace(/&apos;|&quot;|&amp;|&lt;|&gt;|&mdash;|&nbsp;/g, (m) => ENTITIES[m]);
const squish = (s) => {
  // Normalize any HTML br variant (<br/>, <br />, <BR />) → canonical <br> token, then
  // squish whitespace in each segment independently so the marker survives collapsing.
  const normalized = decode(s).replace(/\s*<br\s*\/?>\s*/gi, "<br>");
  return normalized.split("<br>").map((p) => p.replace(/\s+/g, " ").trim()).join("<br>");
};
const hasLetters = (s) => /[A-Za-z]/.test(s);
// Skip runs that are pure punctuation / arrows / symbols / single glyphs.
const isContent = (s) => s.length >= 2 && hasLetters(s) && !/^[#/\d.\s]+$/.test(s);

// Inline tags whose text belongs to the surrounding paragraph (absorbed, not
// emitted separately). Block/leaf tags whose full inner text is ONE entry.
const LEAF = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "kbd", "blockquote", "summary", "figcaption", "label", "em", "strong", "code"]);
const tagName = (node) => {
  const t = node.tagName ?? node.openingElement?.tagName;
  return t ? t.getText(node.getSourceFile?.() ?? node.parent?.getSourceFile?.()) : "";
};

// Collect all JSX text under a node, in order, joined + squished.
// <br /> self-closing elements are emitted as the canonical <br> token.
function innerText(node, sf) {
  let out = "";
  const visit = (n) => {
    if (n.kind === ts.SyntaxKind.JsxText) out += n.text;
    else if (ts.isJsxExpression(n)) {
      // {" "} joiners and {"–"} literal strings contribute their string value.
      const expr = n.expression;
      if (expr && ts.isStringLiteralLike(expr)) out += expr.text;
      else out += " ";
    } else if (ts.isJsxSelfClosingElement(n)) {
      // Capture <br /> as the canonical line-break token.
      if (tagName(n).toLowerCase() === "br") { out += "<br>"; return; }
      n.forEachChild(visit);
    } else n.forEachChild(visit);
  };
  node.forEachChild(visit);
  return squish(out);
}

function extractPage(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const prose = [];
  const lists = [];
  const meta = {};

  // metadata.title / metadata.description
  const findMeta = (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText(sf) === "metadata" && n.initializer && ts.isObjectLiteralExpression(n.initializer)) {
      for (const p of n.initializer.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const key = p.name.getText(sf);
        if (key === "description" && ts.isStringLiteralLike(p.initializer)) meta.description = squish(p.initializer.text);
        if (key === "title") {
          if (ts.isStringLiteralLike(p.initializer)) meta.title = squish(p.initializer.text);
          else if (ts.isObjectLiteralExpression(p.initializer)) {
            const d = p.initializer.properties.find((x) => ts.isPropertyAssignment(x) && x.name.getText(sf) === "default");
            if (d && ts.isStringLiteralLike(d.initializer)) meta.title = squish(d.initializer.text);
          }
        }
      }
    }
    n.forEachChild(findMeta);
  };
  findMeta(sf);

  // page-local content arrays: const NAME = [ "..." , ... ]  (string lists only)
  const findArrays = (n) => {
    if (ts.isVariableDeclaration(n) && n.initializer && ts.isArrayLiteralExpression(n.initializer)) {
      const items = n.initializer.elements;
      if (items.length && items.every((e) => ts.isStringLiteralLike(e))) {
        const values = items.map((e) => squish(e.text)).filter(isContent);
        if (values.length) lists.push({ name: n.name.getText(sf), items: values });
      }
    }
    n.forEachChild(findArrays);
  };
  findArrays(sf);

  // JSX prose, de-duplicated by leaf-container.
  const seen = new Set();
  const walk = (n) => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = tagName(n);
      if (LEAF.has(tag) && ts.isJsxElement(n)) {
        const txt = innerText(n, sf);
        if (isContent(txt) && !seen.has(txt)) { seen.add(txt); prose.push(txt); }
        return; // absorb subtree
      }
    }
    if (n.kind === ts.SyntaxKind.JsxText) {
      const txt = squish(n.text);
      if (isContent(txt) && !seen.has(txt)) { seen.add(txt); prose.push(txt); }
      return;
    }
    n.forEachChild(walk);
  };
  walk(sf);

  return { meta, prose, lists };
}

// ── load catalogs from data.ts + store.ts ────────────────────────────────────
const data = await import(pathToFileURL(path.join(root, "lib/data.ts")).href);
const store = await import(pathToFileURL(path.join(root, "lib/store.ts")).href);

const STRING_KEYS_SKIP = new Set(["url", "href", "id", "slug", "accent", "language", "category", "kind", "fulfillment", "vibe", "status", "tag", "year", "n", "priceCents", "priceNote", "github", "wiki", "repo", "featuredVideoId"]);
// fields that are URLs/codes, not editable prose — listed so the doc stays clean.

function walkCatalog(value, keyPath, out) {
  if (typeof value === "string") {
    out.push({ key: keyPath, text: value });
  } else if (Array.isArray(value)) {
    // A list of plain strings (roles, highlights, bullets…) → an editable list.
    if (value.length && value.every((v) => typeof v === "string")) {
      out.push({ stringList: keyPath, items: value.slice() });
      return;
    }
    out.push({ listHeader: keyPath, count: value.length });
    value.forEach((item, i) => {
      const id = (item && (item.slug || item.id)) || i;
      if (typeof item === "string") out.push({ key: `${keyPath}[${i}]`, text: item, inList: keyPath });
      else walkCatalog(item, `${keyPath}.${id}`, out);
    });
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (STRING_KEYS_SKIP.has(k)) continue;
      if (typeof v === "string") {
        if (k === "label" && /^https?:/.test(value.url || "")) { /* link label, keep */ }
        out.push({ key: `${keyPath}.${k}`, text: v });
      } else if (Array.isArray(v) || (v && typeof v === "object")) {
        walkCatalog(v, `${keyPath}.${k}`, out);
      }
    }
  }
}

// ── build document ───────────────────────────────────────────────────────────
const pages = [
  ["Home", "/", "app/page.tsx"],
  ["About", "/about", "app/about/page.tsx"],
  ["Training", "/training", "app/training/page.tsx"],
  ["Open Source", "/repos", "app/repos/page.tsx"],
  ["Repo detail (template)", "/repos/[slug]", "app/repos/[slug]/page.tsx"],
  ["AI Skills", "/skills", "app/skills/page.tsx"],
  ["Videos", "/videos", "app/videos/page.tsx"],
  ["The Lab", "/lab", "app/lab/page.tsx"],
  ["Lab product (template)", "/lab/[slug]", "app/lab/[slug]/page.tsx"],
  ["Store", "/store", "app/store/page.tsx"],
  ["Store success", "/store/success", "app/store/success/page.tsx"],
  ["Links", "/links", "app/links/page.tsx"],
];

const snapshot = {};
let md = "";
md += `# Alex Coulombe Presents — all website copy\n\n`;
md += `> **Generated file — edit the text, not the structure.** Regenerate anytime with \`node scripts/gen-content.mjs\`.\n>\n`;
md += `> **How to edit:** change the words after each \`▸\`. Leave the \`[id]\` tags alone — they tell Claude exactly where each line lives. Type \`<br>\` anywhere in a string to insert a line break (e.g. \`▸ Line one<br>Line two\`).\n>\n`;
md += `> **Lists** are marked \`(N items — add or remove lines freely)\`. Add a new \`- \` line to grow a list; delete a line to shrink it. Claude will notice the count change and update the site (e.g. the rotating "Currently:" descriptors).\n>\n`;
md += `> **When you're done:** tell Claude *"sweep the copy"* and your edits get applied to the live site, then redeployed.\n\n`;
md += `---\n\n`;

for (const [name, route, file] of pages) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) continue;
  const { meta, prose, lists } = extractPage(abs);
  md += `## ${name}  ·  \`${route}\`\n`;
  md += `<sub>${file}</sub>\n\n`;
  const pid = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";

  if (meta.title || meta.description) {
    md += `**Browser tab / SEO**\n\n`;
    if (meta.title) { const k = `${pid}.meta.title`; snapshot[k] = meta.title; md += `- \`[${k}]\` ▸ ${meta.title}\n`; }
    if (meta.description) { const k = `${pid}.meta.description`; snapshot[k] = meta.description; md += `- \`[${k}]\` ▸ ${meta.description}\n`; }
    md += `\n`;
  }

  if (prose.length) {
    md += `**On the page**\n\n`;
    let n = 0;
    for (const t of prose) {
      if (t === route) continue; // skip the little "/about" route kicker
      n += 1;
      const k = `${pid}.${n}`;
      snapshot[k] = t;
      md += `- \`[${k}]\` ▸ ${t}\n`;
    }
    md += `\n`;
  }

  for (const list of lists) {
    const k = `${pid}.list.${list.name}`;
    snapshot[k] = list.items;
    md += `**List: ${list.name}**  (${list.items.length} items — add or remove lines freely)\n\n`;
    for (const it of list.items) md += `- ${it}\n`;
    md += `\n`;
  }
  md += `---\n\n`;
}

// Catalogs
md += `## Catalogs  ·  \`lib/data.ts\`\n`;
md += `<sub>Structured content reused across pages. Each entry can be edited; whole entries can be added or removed.</sub>\n\n`;

const catalogExports = ["roles", "timeline", "courses", "repos", "products", "agentSkills", "videos", "featuredVideo", "playlists", "trainingPlaylist", "externalLinks", "site"];
for (const ex of catalogExports) {
  if (!(ex in data)) continue;
  const out = [];
  walkCatalog(data[ex], `data.${ex}`, out);
  if (!out.length) continue;
  const isStr = Array.isArray(data[ex]) && typeof data[ex][0] === "string";
  const heading = Array.isArray(data[ex])
    ? `### ${ex}  (${data[ex].length} ${isStr ? "items — add or remove lines freely" : "entries — add or remove whole entries"})`
    : `### ${ex}`;
  md += `${heading}\n\n`;
  for (const row of out) {
    if (row.stringList) {
      const nm = row.stringList.split(".").pop();
      snapshot[row.stringList] = row.items;
      if (row.stringList !== `data.${ex}`) md += `\n  **list: ${nm}** (${row.items.length} items — add or remove lines freely)\n`;
      for (const it of row.items) md += `  - ${squish(it)}\n`;
      continue;
    }
    if (row.listHeader && row.listHeader !== `data.${ex}`) continue;
    if (row.key) { snapshot[row.key] = row.text; md += `- \`[${row.key}]\` ▸ ${squish(row.text)}\n`; }
  }
  md += `\n`;
}

// Store
md += `---\n\n## Store catalog  ·  \`lib/store.ts\`\n`;
md += `<sub>Prices are placeholders until the store goes live; edit names, blurbs, and delivery text here.</sub>\n\n`;
if (store.storeItems) {
  const out = [];
  walkCatalog(store.storeItems, `store.storeItems`, out);
  md += `### storeItems  (${store.storeItems.length} entries — add or remove whole entries)\n\n`;
  for (const row of out) {
    if (row.stringList) {
      snapshot[row.stringList] = row.items;
      md += `\n  **list: ${row.stringList.split(".").pop()}** (${row.items.length} items)\n`;
      for (const it of row.items) md += `  - ${squish(it)}\n`;
      continue;
    }
    if (row.listHeader) continue;
    if (row.key) { snapshot[row.key] = row.text; md += `- \`[${row.key}]\` ▸ ${squish(row.text)}\n`; }
  }
  md += `\n`;
}

// ── write outputs ────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(root, "CONTENT.md"), md);
fs.mkdirSync(path.join(root, "content"), { recursive: true });
fs.writeFileSync(path.join(root, "content/strings.snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");

const scalarCount = Object.values(snapshot).filter((v) => typeof v === "string").length;
const listCount = Object.values(snapshot).filter((v) => Array.isArray(v)).length;
console.log(`CONTENT.md written — ${scalarCount} text strings, ${listCount} lists, across ${pages.length} pages + catalogs.`);
