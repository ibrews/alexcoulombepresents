import test from "node:test";
import assert from "node:assert/strict";
import { classSessions, calendarBreaks, upcomingSessions, pastSessions, sessionForStoreSlug, isUnlisted, isPast } from "../lib/classSessions.ts";
import { instructors } from "../lib/instructors.ts";
import { storeItems, wednesdayCalendar } from "../lib/store.ts";
import { classFolders } from "../lib/classMaterials.ts";
import { recordings } from "../lib/recordings.ts";
import { sessionSummaries } from "../lib/classSummaries.ts";

test("session page slugs are unique and URL-safe", () => {
  const slugs = classSessions.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/, slug);
});

test("a page slug's date matches the session's date in New York", () => {
  for (const s of classSessions) {
    const ny = new Date(s.startsISO).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    assert.equal(s.slug.slice(0, 10), ny, s.slug);
  }
});

test("every session names a real instructor", () => {
  const ids = new Set(instructors.map((i) => i.id));
  for (const s of classSessions) {
    assert.ok(s.instructorIds.length > 0, `${s.slug} has no instructor`);
    for (const id of s.instructorIds) assert.ok(ids.has(id), `${s.slug} → unknown instructor ${id}`);
  }
});

test("a paid class's page and its store item agree on the time", () => {
  // The store item drives checkout, Zoom, and the check-in cron; the page is
  // what people share. If they disagree, someone shows up an hour off.
  for (const s of classSessions.filter((x) => x.kind === "class" && x.storeSlug)) {
    const item = storeItems.find((i) => i.slug === s.storeSlug);
    assert.ok(item, `${s.slug} → unknown store item ${s.storeSlug}`);
    assert.equal(item!.sessionDateISO, s.startsISO, `${s.slug} time differs from ${s.storeSlug}`);
  }
});

test("every dated Wednesday class has a page", () => {
  for (const item of wednesdayCalendar) {
    assert.ok(sessionForStoreSlug(item.slug), `calendar item ${item.slug} has no /classes page`);
  }
});

test("Wednesday classes are on a Wednesday at 11a New York time", () => {
  for (const s of classSessions.filter((x) => x.kind === "class")) {
    const d = new Date(s.startsISO);
    const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
    const hour = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" });
    assert.equal(weekday, "Wednesday", s.slug);
    assert.equal(hour, "11", `${s.slug} starts at ${hour}:00 ET`);
  }
});

test("materials and recording cross-links resolve", () => {
  const folders = new Set(classFolders.map((f) => f.slug));
  const recs = new Set(recordings.map((r) => r.slug));
  for (const s of classSessions) {
    if (s.materialsSlug) assert.ok(folders.has(s.materialsSlug), `${s.slug} → unknown folder ${s.materialsSlug}`);
    if (s.recordingSlug) assert.ok(recs.has(s.recordingSlug), `${s.slug} → unknown recording ${s.recordingSlug}`);
  }
});

test("every recorded session has a summary", () => {
  for (const s of classSessions.filter((x) => x.recordingSlug)) {
    const rec = recordings.find((r) => r.slug === s.recordingSlug)!;
    assert.ok(rec.youtubeId && sessionSummaries[rec.youtubeId], `${s.slug} has a recording but no summary`);
  }
});

test("upcoming sessions describe what you'll learn; free ones say where to watch", () => {
  for (const s of classSessions.filter((x) => Date.parse(x.startsISO) > Date.parse("2026-10-06T00:00:00Z"))) {
    assert.ok(s.learn && s.learn.length >= 3, `${s.slug} needs a "what you'll learn" list`);
    if (!s.storeSlug) assert.ok(s.watchUrl, `${s.slug} is neither sold nor free to watch`);
  }
});

test("a break never lands on a scheduled class", () => {
  for (const b of calendarBreaks) {
    assert.ok(!classSessions.some((s) => s.startsISO.startsWith(b.dateISO)), `break ${b.dateISO} collides with a class`);
  }
});

test("past/upcoming split is by end time, newest past first", () => {
  const now = Date.parse("2026-10-14T16:00:00Z"); // an hour into the Oct 14 class
  const upcoming = upcomingSessions(now, { includeUnlisted: true }).map((s) => s.slug);
  const past = pastSessions(now, { includeUnlisted: true }).map((s) => s.slug);
  assert.equal(upcoming[0], "2026-10-14-metahuman-wardrobes");
  assert.equal(past[0], "2026-10-07-membership-tour-livestream");
  assert.equal(upcoming.length + past.length, classSessions.length);
});

test("unlisted classes stay out of listings but keep their pages", () => {
  const now = Date.parse("2026-10-06T12:00:00Z");
  const listed = upcomingSessions(now).map((s) => s.slug);
  const all = upcomingSessions(now, { includeUnlisted: true }).map((s) => s.slug);
  for (const s of classSessions.filter(isUnlisted)) {
    assert.ok(!listed.includes(s.slug), `${s.slug} is unlisted but listed`);
    assert.ok(all.includes(s.slug) || isPast(s, now), `${s.slug} vanished entirely`);
  }
});

test("no class page shows a price — Stripe Checkout does", () => {
  for (const s of classSessions.filter((x) => x.kind === "class" && x.storeSlug && Date.parse(x.startsISO) > Date.parse("2026-10-06T00:00:00Z"))) {
    const item = storeItems.find((i) => i.slug === s.storeSlug)!;
    assert.equal(item.hidePrice, true, `${s.slug} would show its price`);
    assert.ok(!/UE5/.test(item.priceNote ?? ""), `${s.slug} advertises the UE5 code`);
  }
});
