import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { test } from "node:test";
import { products } from "../lib/data.ts";
import { surrealMindsBackendRows, surrealMindsImages } from "../lib/surrealMindsDiary.ts";

test("Surreal Minds is a labeled experiment with a reachable diary", () => {
  const product = products.find((candidate) => candidate.slug === "surreal-minds");
  assert.ok(product);
  assert.equal(product.experiment, true);
  assert.equal(product.guide?.href, "/lab/surreal-minds/devlog");
  assert.match(product.status, /in progress/i);
});

test("backend scorecard leaves the unrun cloud route unmeasured", () => {
  assert.deepEqual(
    surrealMindsBackendRows.map((row) => row.status),
    ["measured", "partial", "not-run"],
  );
  assert.equal(surrealMindsBackendRows[2].measured, "Not run yet");
});

test("diary keeps editor, emulator, and headset evidence separate", () => {
  assert.deepEqual(
    new Set(surrealMindsImages.map((image) => image.surface)),
    new Set(["Unreal desktop preview", "PICO emulator", "Quest 3 headset"]),
  );

  for (const image of surrealMindsImages) {
    const path = `public${image.src}`;
    assert.equal(existsSync(path), true, `${path} should exist`);
    assert.ok(statSync(path).size > 10_000, `${path} should contain a real web image`);
  }
});
