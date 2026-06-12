// ─────────────────────────────────────────────────────────────────────────────
// diff-content.mjs — compare the (edited) CONTENT.md against the snapshot taken
// the last time gen-content ran, and print exactly what changed: which text
// strings were reworded, and which lists grew or shrank — with the source file
// each change maps to. This is the "sweep" planner; Claude applies the changes.
//
//   node scripts/diff-content.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "content/strings.snapshot.json"), "utf8"));
const doc = fs.readFileSync(path.join(root, "CONTENT.md"), "utf8");

// page id → source file (keep in sync with gen-content.mjs `pages`)
const PAGE_FILE = {
  home: "app/page.tsx", about: "app/about/page.tsx", training: "app/training/page.tsx",
  repos: "app/repos/page.tsx", "repos-slug": "app/repos/[slug]/page.tsx", skills: "app/skills/page.tsx",
  videos: "app/videos/page.tsx", lab: "app/lab/page.tsx", "lab-slug": "app/lab/[slug]/page.tsx",
  store: "app/store/page.tsx", "store-success": "app/store/success/page.tsx", links: "app/links/page.tsx",
};
const fileForKey = (key) => {
  if (key.startsWith("data.")) return "lib/data.ts";
  if (key.startsWith("store.")) return "lib/store.ts";
  const pid = key.split(".")[0];
  return PAGE_FILE[pid] ?? "(page)";
};

// ── parse the edited doc back into a key→value map ───────────────────────────
const edited = {};
const lines = doc.split("\n");
let listKey = null; // when inside a list block, collect bare "- item" lines
let listItems = null;
let lastDataPrefix = null; // e.g. data.repos.blueprint-auto-layout

const flushList = () => {
  if (listKey) edited[listKey] = listItems;
  listKey = null; listItems = null;
};

for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");
  const scalar = line.match(/^\s*-\s+`\[([^\]]+)\]`\s+▸\s+(.*)$/);
  if (scalar) {
    flushList();
    edited[scalar[1]] = scalar[2];
    const m = scalar[1].match(/^(data\.[^.]+(?:\.[^.]+)?)\./);
    if (scalar[1].startsWith("data.")) lastDataPrefix = scalar[1].split(".").slice(0, -1).join(".");
    continue;
  }
  // page list:  **List: venues**  (N items …)
  const pageList = line.match(/^\*\*List:\s+([^*]+?)\*\*/);
  if (pageList) {
    flushList();
    // find enclosing page id from the most recent scalar key
    const pid = Object.keys(edited).reverse().find((k) => PAGE_FILE[k.split(".")[0]]);
    const pageId = pid ? pid.split(".")[0] : "home";
    listKey = `${pageId}.list.${pageList[1].trim()}`; listItems = [];
    continue;
  }
  // catalog top-level string list:  ### roles  (N items — add or remove …)
  const catList = line.match(/^###\s+([A-Za-z0-9]+)\s+\(\d+\s+items\s+—\s+add or remove/);
  if (catList) { flushList(); listKey = `data.${catList[1]}`; listItems = []; continue; }
  // nested list:  **list: highlights** (N items …)
  const nested = line.match(/^\s*\*\*list:\s+([^*]+?)\*\*/);
  if (nested) {
    flushList();
    listKey = lastDataPrefix ? `${lastDataPrefix}.${nested[1].trim()}` : `data.${nested[1].trim()}`;
    listItems = [];
    continue;
  }
  if (listItems) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && !line.includes("▸")) { listItems.push(item[1]); continue; }
    if (line.trim() === "" ) continue; // blank lines inside a list are ok
    flushList();
  }
}
flushList();

// ── diff ─────────────────────────────────────────────────────────────────────
const changedText = [];
const changedLists = [];
for (const [key, before] of Object.entries(snapshot)) {
  const after = edited[key];
  if (after === undefined) continue; // not present in doc (shouldn't happen)
  if (Array.isArray(before)) {
    const a = before, b = after;
    const added = b.filter((x) => !a.includes(x));
    const removed = a.filter((x) => !b.includes(x));
    const reordered = !added.length && !removed.length && a.join("|") !== b.join("|");
    if (added.length || removed.length || reordered) changedLists.push({ key, file: fileForKey(key), before: a, after: b, added, removed, reordered });
  } else if (typeof before === "string" && before !== after) {
    changedText.push({ key, file: fileForKey(key), before, after });
  }
}

// ── report ───────────────────────────────────────────────────────────────────
if (!changedText.length && !changedLists.length) {
  console.log("No copy changes — CONTENT.md matches the current site.");
  process.exit(0);
}
console.log(`\n=== ${changedText.length} text edit(s) ===\n`);
for (const c of changedText) {
  console.log(`• [${c.key}]  (${c.file})`);
  console.log(`    – before: ${c.before}`);
  console.log(`    + after:  ${c.after}\n`);
}
console.log(`\n=== ${changedLists.length} list change(s) ===\n`);
for (const c of changedLists) {
  console.log(`• ${c.key}  (${c.file})  ${c.before.length} → ${c.after.length} items`);
  for (const x of c.added) console.log(`    + added:   ${x}`);
  for (const x of c.removed) console.log(`    – removed: ${x}`);
  if (c.reordered) console.log(`    ~ reordered`);
  console.log("");
}
console.log("Hand this plan to Claude — it applies each change to the file shown, rebuilds, and redeploys.\n");
