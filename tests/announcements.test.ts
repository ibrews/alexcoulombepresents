import test from "node:test";
import assert from "node:assert/strict";
import { announcements } from "../lib/announcements.ts";
import { classSessions, sessionBySlug } from "../lib/classSessions.ts";

// The banner resolves by Eastern calendar date (components/AnnouncementBanner.tsx).
function newYorkDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function bannerFor(day: string) {
  return announcements.find((a) => day >= a.start && day <= a.end);
}

test("a banner that links a class page names that class and comes down after it", () => {
  for (const a of announcements) {
    const slug = a.href.match(/^\/classes\/([^/#?]+)$/)?.[1];
    if (!slug) continue;
    const s = sessionBySlug(slug);
    assert.ok(s, `${a.id} links /classes/${slug}, which doesn't exist`);
    if (s.kind !== "class") continue;
    assert.ok(a.text.includes(s.title), `${a.id} should name "${s.title}"`);
    assert.equal(a.end, newYorkDate(s.startsISO), `${a.id} should end on its class day`);
  }
});

test("every day of the Oct–Nov run promotes the next class, by its real title", () => {
  const run = classSessions
    .filter((s) => s.kind === "class" && s.startsISO >= "2026-10-08" && s.startsISO < "2026-11-19")
    .sort((a, b) => a.startsISO.localeCompare(b.startsISO));
  assert.equal(run.length, 6);
  for (let d = new Date("2026-10-08T12:00:00Z"); d <= new Date("2026-11-18T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const next = run.find((s) => newYorkDate(s.startsISO) >= day);
    assert.ok(next, day);
    const banner = bannerFor(day);
    assert.ok(banner?.text.includes(next.title), `${day}: banner "${banner?.text}" should name "${next.title}"`);
  }
});

test("the livestream banner is gone the day after the stream", () => {
  assert.notEqual(bannerFor("2026-10-08")?.id, "membership-tour-livestream");
});
