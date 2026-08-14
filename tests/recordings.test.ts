import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { recordings } from "../lib/recordings.ts";
import { materials, findMaterial, MATERIALS_DIR } from "../lib/materials.ts";

test("recording slugs are unique", () => {
  const slugs = recordings.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("every recording has a watchable url and a sortable date", () => {
  for (const r of recordings) {
    assert.match(r.recordedAt, /^\d{4}-\d{2}-\d{2}$/, `${r.slug} recordedAt`);
    assert.ok(r.url.startsWith("https://"), `${r.slug} url`);
    if (r.youtubeId) assert.ok(r.url.includes(r.youtubeId), `${r.slug} url/youtubeId mismatch`);
  }
});

test("every gated material link resolves to a file on disk", () => {
  // A dead /api/members/material key renders as a download button that 404s
  // for a paying member — cheapest possible thing to catch here.
  for (const r of recordings) {
    for (const m of r.materials ?? []) {
      if (!m.href.startsWith("/api/members/material")) continue;
      const key = new URL(m.href, "https://x.invalid").searchParams.get("key") ?? "";
      const material = findMaterial(key);
      assert.ok(material, `${r.slug} references unknown material key "${key}"`);
      assert.ok(
        existsSync(path.join(MATERIALS_DIR, material.file)),
        `missing file for material "${key}": ${material.file}`
      );
    }
  }
});

test("material keys are unique", () => {
  const keys = materials.map((m) => m.key);
  assert.equal(new Set(keys).size, keys.length);
});
