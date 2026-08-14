import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { classFolders, findMaterial, sharedFolder, canOpen, type ClassFolder } from "../lib/classMaterials.ts";
import { storeItems } from "../lib/store.ts";

const MATERIALS_DIR = path.join(process.cwd(), "content", "materials");

test("folder slugs are unique", () => {
  const slugs = classFolders.map((f) => f.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("material keys are unique within each folder", () => {
  for (const f of classFolders) {
    const keys = f.materials.map((m) => m.key);
    assert.equal(new Set(keys).size, keys.length, `${f.slug} has duplicate material keys`);
  }
});

test("a buyable folder's slug matches a real store item", () => {
  // This equality IS the entitlement link: access is granted by a
  // catalog_orders row whose slug equals the folder slug. A typo here would
  // produce a folder nobody can ever unlock by paying — and it would look
  // completely fine in the UI, which is exactly why it's asserted.
  const storeSlugs = new Set(storeItems.map((i) => i.slug));
  for (const f of classFolders) {
    if (f.membersOnly) continue;
    assert.ok(
      storeSlugs.has(f.slug),
      `folder "${f.slug}" has no store item — nobody could ever buy their way in`
    );
  }
});

test("local materials exist on disk", () => {
  for (const f of classFolders) {
    for (const m of f.materials) {
      if (m.source.kind !== "local") continue;
      assert.ok(
        existsSync(path.join(MATERIALS_DIR, m.source.file)),
        `${f.slug}/${m.key} → missing file ${m.source.file}`
      );
    }
  }
});

test("local material paths stay inside content/materials", () => {
  for (const f of classFolders) {
    for (const m of f.materials) {
      if (m.source.kind !== "local") continue;
      const full = path.resolve(MATERIALS_DIR, m.source.file);
      assert.ok(full.startsWith(MATERIALS_DIR + path.sep), `${f.slug}/${m.key} escapes the dir`);
    }
  }
});

test("external and r2 sources are well formed", () => {
  for (const f of classFolders) {
    for (const m of f.materials) {
      if (m.source.kind === "external") {
        assert.ok(m.source.url.startsWith("https://"), `${f.slug}/${m.key} url`);
      }
      if (m.source.kind === "r2") {
        assert.ok(m.source.key.length > 0, `${f.slug}/${m.key} r2 key`);
        assert.ok(!m.source.key.startsWith("/"), `${f.slug}/${m.key} r2 key must not be absolute`);
      }
    }
  }
});

test("findMaterial resolves every registered pair and rejects junk", () => {
  for (const f of classFolders) {
    for (const m of f.materials) {
      assert.ok(findMaterial(f.slug, m.key), `${f.slug}/${m.key} should resolve`);
    }
  }
  assert.equal(findMaterial("nope", "nope"), undefined);
  assert.equal(findMaterial(classFolders[0].slug, "nope"), undefined);
});

test("sharedFolder() produces a gated, primary external entry", () => {
  const m = sharedFolder({ url: "https://drive.google.com/drive/folders/abc" });
  assert.equal(m.key, "folder");
  assert.equal(m.primary, true);
  assert.equal(m.source.kind, "external");
  assert.match(m.label, /Google Drive/);
  // Host is part of the label so a Dropbox folder doesn't say "Google Drive".
  assert.match(sharedFolder({ url: "https://x.test/a", host: "Dropbox" }).label, /Dropbox/);
});

test("at most one primary material per folder", () => {
  // Two primaries would render two competing "this is the folder" buttons.
  for (const f of classFolders) {
    const primaries = f.materials.filter((m) => m.primary);
    assert.ok(primaries.length <= 1, `${f.slug} has ${primaries.length} primary materials`);
  }
});

test("every dated Wednesday class has a folder", () => {
  // The whole point is one folder per class — a class that sells but has no
  // folder sends its buyers to a page that doesn't exist.
  const folderSlugs = new Set(classFolders.map((f) => f.slug));
  const dated = storeItems.filter((i) => i.sessionDateISO);
  for (const item of dated) {
    assert.ok(folderSlugs.has(item.slug), `class "${item.slug}" has no materials folder`);
  }
});

test("a rerun of the same class title never opens on another session's purchase", () => {
  // Alex, 2026-08-15: "teach Intro to XR 5 times, a member should have
  // access to all of them, someone who bought a single class should only
  // have access to the one." Encodes that at the function level rather than
  // just asserting slugs are unique — proves the ACCESS CHECK, not just the
  // data shape, keeps two same-titled sessions apart.
  const sessionA: ClassFolder = {
    slug: "wed-2026-11-04-intro-xr",
    title: "Intro to XR",
    blurb: "",
    materials: [],
  };
  const sessionB: ClassFolder = {
    slug: "wed-2026-11-18-intro-xr",
    title: "Intro to XR", // same title, different session — the whole point
    blurb: "",
    materials: [],
  };

  const boughtA = { member: false, purchasedSlugs: [sessionA.slug] };
  assert.equal(canOpen(sessionA, boughtA), true, "buyer should open their own session");
  assert.equal(canOpen(sessionB, boughtA), false, "buyer must NOT open a same-titled different session");

  const member = { member: true, purchasedSlugs: [] };
  assert.equal(canOpen(sessionA, member), true, "member opens every session");
  assert.equal(canOpen(sessionB, member), true, "member opens every session");
});
