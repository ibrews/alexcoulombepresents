import test from "node:test";
import assert from "node:assert/strict";
import { storeItems } from "../lib/store.ts";

// storeItems.slug is the root everything else derives from: a class's
// materials folder, its Stripe checkout metadata, its catalog_orders rows,
// and (per class) its access grant all key off this string. Nothing upstream
// of this ever checked it was unique. Concretely: teach "Intro to XR" five
// times, copy-paste the Wednesday entry for each rerun, forget to bump the
// date in one slug — two different class dates silently become the same
// purchasable item, and buying a seat in the rerun would register as having
// bought the original (or vice versa).
test("store item slugs are unique — a copy-pasted rerun that keeps the old slug merges two different classes", () => {
  const slugs = storeItems.map((i) => i.slug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  assert.equal(new Set(slugs).size, slugs.length, `duplicate slug(s): ${[...new Set(dupes)].join(", ")}`);
});

test("a repeated class title always carries a distinct, dated slug", () => {
  // Titles are allowed to repeat — "Intro to VR" taught again in November is
  // supposed to say "Intro to VR" again. What must never repeat is the slug,
  // since that's the purchase key. Group by name and require every session's
  // slug to be unique within that group (redundant with the global check
  // above, but states the specific scenario this test exists for).
  const byName = new Map<string, string[]>();
  for (const item of storeItems) {
    if (!item.sessionDateISO) continue; // only dated class sessions rerun
    byName.set(item.name, [...(byName.get(item.name) ?? []), item.slug]);
  }
  for (const [name, slugs] of byName) {
    assert.equal(new Set(slugs).size, slugs.length, `"${name}" has reruns sharing a slug: ${slugs}`);
  }
});
