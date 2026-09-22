import test from "node:test";
import assert from "node:assert/strict";
import { appearances, partitionAppearances } from "../lib/appearances.ts";

test("fall hellos are chronological even when PMRE was inserted before October events", () => {
  assert.deepEqual(partitionAppearances(Date.parse("2026-09-22T12:00:00Z")).upcoming.map((a) => a.slug), [
    "asai-architecture-in-perspective-2026", "augmented-enterprise-summit-2026",
    "android-dev-summit-2026", "pmre-2026-keynote",
  ]);
});

test("multi-day events stay upcoming through their final local date and then move to history", () => {
  for (const slug of ["asai-architecture-in-perspective-2026", "augmented-enterprise-summit-2026", "android-dev-summit-2026", "pmre-2026-keynote"]) {
    const event = appearances.find((a) => a.slug === slug)!;
    const end = Date.parse(event.endsISO);
    assert.ok(partitionAppearances(end).upcoming.some((a) => a.slug === slug));
    assert.ok(!partitionAppearances(end + 1).upcoming.some((a) => a.slug === slug));
    assert.ok(partitionAppearances(end + 1).past.some((a) => a.slug === slug));
  }
});

test("recent history sorts by event date, independent of append order", () => {
  assert.equal(partitionAppearances(Date.parse("2026-11-21T12:00:00Z")).past[0].slug, "pmre-2026-keynote");
});
