import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { recordings } from "../lib/recordings.ts";
import { classFolders, findMaterial } from "../lib/classMaterials.ts";

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

test("every gated material link resolves in the class-materials registry", () => {
  // A dead /api/materials link renders as a download button that 404s for a
  // paying member — cheapest possible thing to catch here.
  for (const r of recordings) {
    for (const m of r.materials ?? []) {
      if (!m.href.startsWith("/api/materials")) continue;
      const q = new URL(m.href, "https://x.invalid").searchParams;
      const folderSlug = q.get("class") ?? "";
      const key = q.get("key") ?? "";
      const found = findMaterial(folderSlug, key);
      assert.ok(found, `${r.slug} references unknown material ${folderSlug}/${key}`);
      if (found.material.source.kind === "local") {
        assert.ok(
          existsSync(path.join(process.cwd(), "content", "materials", found.material.source.file)),
          `missing file for ${folderSlug}/${key}`
        );
      }
    }
  }
});

test("every recording's class folder cross-link points at a real folder", () => {
  const slugs = new Set(recordings.map((r) => r.slug));
  for (const f of classFolders) {
    if (!f.recordingSlug) continue;
    assert.ok(slugs.has(f.recordingSlug), `folder ${f.slug} → unknown recording ${f.recordingSlug}`);
  }
});
