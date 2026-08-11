// ── Booking availability tests ──────────────────────────────────────────────
// lib/booking/* has no runtime imports, so these run the real logic against
// recorded ICS shapes with no network and no database.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { busyIntervalsFromIcs, parseIcsDate, zonedWallTimeToUtc } from "../lib/booking/ics.ts";
import { generateSlots, formatSlot, type BookingConfig } from "../lib/booking/availability.ts";

const ET = "America/New_York";

const CONFIG: BookingConfig = {
  timeZone: ET,
  slotMinutes: 60,
  // Tuesdays 9am–12pm ET only, to keep expectations countable.
  weeklyHours: { 2: [{ from: "09:00", to: "12:00" }] },
  minNoticeHours: 24,
  horizonDays: 14,
  bufferMinutes: 0,
};

function ics(body: string): string {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`;
}

// ── timezone handling ───────────────────────────────────────────────────────

test("wall-clock to UTC is correct in EDT and EST (DST is not a fixed offset)", () => {
  // August: EDT, UTC-4 → 11:00 ET is 15:00Z
  assert.equal(zonedWallTimeToUtc(2026, 8, 12, 11, 0, ET).toISOString(), "2026-08-12T15:00:00.000Z");
  // January: EST, UTC-5 → 11:00 ET is 16:00Z. A hardcoded offset breaks here.
  assert.equal(zonedWallTimeToUtc(2026, 1, 14, 11, 0, ET).toISOString(), "2026-01-14T16:00:00.000Z");
});

test("ICS UTC, floating, and all-day forms all parse", () => {
  assert.equal(parseIcsDate("20260812T150000Z", ET)?.toISOString(), "2026-08-12T15:00:00.000Z");
  // Floating is read as local ET → 15:00Z in August.
  assert.equal(parseIcsDate("20260812T110000", ET)?.toISOString(), "2026-08-12T15:00:00.000Z");
  // All-day starts at local midnight, not UTC midnight.
  assert.equal(parseIcsDate("20260812", ET)?.toISOString(), "2026-08-12T04:00:00.000Z");
  assert.equal(parseIcsDate("nonsense", ET), null);
});

// ── ICS parsing ─────────────────────────────────────────────────────────────

test("a plain event yields one busy interval", () => {
  const out = busyIntervalsFromIcs(
    ics("BEGIN:VEVENT\r\nDTSTART:20260812T150000Z\r\nDTEND:20260812T160000Z\r\nEND:VEVENT"),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-09-01T00:00:00Z"),
    ET
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].start.toISOString(), "2026-08-12T15:00:00.000Z");
});

test("TRANSPARENT and CANCELLED events are not busy", () => {
  const transparent = busyIntervalsFromIcs(
    ics("BEGIN:VEVENT\r\nDTSTART:20260812T150000Z\r\nDTEND:20260812T160000Z\r\nTRANSP:TRANSPARENT\r\nEND:VEVENT"),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-09-01T00:00:00Z"),
    ET
  );
  assert.equal(transparent.length, 0);

  const cancelled = busyIntervalsFromIcs(
    ics("BEGIN:VEVENT\r\nDTSTART:20260812T150000Z\r\nDTEND:20260812T160000Z\r\nSTATUS:CANCELLED\r\nEND:VEVENT"),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-09-01T00:00:00Z"),
    ET
  );
  assert.equal(cancelled.length, 0);
});

test("folded lines are unfolded before parsing (calendars wrap at 75 octets)", () => {
  // RRULE split across a continuation line — parsing without unfolding drops
  // the tail and silently produces a non-recurring event.
  const folded =
    "BEGIN:VEVENT\r\nDTSTART:20260804T150000Z\r\nDTEND:20260804T160000Z\r\n" +
    "RRULE:FREQ=WEEK\r\n LY;COUNT=3\r\nEND:VEVENT";
  const out = busyIntervalsFromIcs(
    ics(folded),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-09-01T00:00:00Z"),
    ET
  );
  assert.equal(out.length, 3);
});

test("weekly recurrence expands, honors COUNT, and respects EXDATE", () => {
  const out = busyIntervalsFromIcs(
    ics(
      "BEGIN:VEVENT\r\nDTSTART:20260804T150000Z\r\nDTEND:20260804T160000Z\r\n" +
        "RRULE:FREQ=WEEKLY;COUNT=3\r\nEXDATE:20260811T150000Z\r\nEND:VEVENT"
    ),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-09-01T00:00:00Z"),
    ET
  );
  // Aug 4, 11, 18 — minus the excluded Aug 11.
  assert.deepEqual(
    out.map((i) => i.start.toISOString()),
    ["2026-08-04T15:00:00.000Z", "2026-08-18T15:00:00.000Z"]
  );
});

test("UNTIL stops the series", () => {
  const out = busyIntervalsFromIcs(
    ics(
      "BEGIN:VEVENT\r\nDTSTART:20260804T150000Z\r\nDTEND:20260804T160000Z\r\n" +
        "RRULE:FREQ=WEEKLY;UNTIL=20260812T000000Z\r\nEND:VEVENT"
    ),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-10-01T00:00:00Z"),
    ET
  );
  assert.equal(out.length, 2); // Aug 4 and Aug 11 only
});

test("an unsupported MONTHLY rule still blocks its first occurrence", () => {
  // Documented limitation: it over-offers later months rather than vanishing.
  const out = busyIntervalsFromIcs(
    ics(
      "BEGIN:VEVENT\r\nDTSTART:20260804T150000Z\r\nDTEND:20260804T160000Z\r\n" +
        "RRULE:FREQ=MONTHLY\r\nEND:VEVENT"
    ),
    new Date("2026-08-01T00:00:00Z"),
    new Date("2026-12-01T00:00:00Z"),
    ET
  );
  assert.equal(out.length, 1);
});

// ── slot generation ─────────────────────────────────────────────────────────

const NOW = new Date("2026-08-10T12:00:00Z"); // Monday

test("slots land inside the configured local window", () => {
  const slots = generateSlots(CONFIG, [], [], NOW);
  assert.ok(slots.length > 0);
  for (const s of slots) {
    const label = formatSlot(s.start, ET);
    assert.match(label, /Tue/, `expected Tuesdays only, got ${label}`);
  }
  // Tuesday 9/10/11am ET on Aug 11 → 13:00/14:00/15:00Z (EDT).
  assert.equal(slots[0].start.toISOString(), "2026-08-11T13:00:00.000Z");
});

test("minNoticeHours suppresses slots that are too soon", () => {
  // 48h notice pushes past Aug 11 entirely; next Tuesday is Aug 18.
  const slots = generateSlots({ ...CONFIG, minNoticeHours: 48 }, [], [], NOW);
  assert.equal(slots[0].start.toISOString(), "2026-08-18T13:00:00.000Z");
});

test("a busy interval removes exactly the overlapping slot", () => {
  const busy = [{ start: new Date("2026-08-11T14:00:00Z"), end: new Date("2026-08-11T15:00:00Z") }];
  const starts = generateSlots(CONFIG, busy, [], NOW).map((s) => s.start.toISOString());
  assert.ok(!starts.includes("2026-08-11T14:00:00.000Z"));
  assert.ok(starts.includes("2026-08-11T13:00:00.000Z"));
  assert.ok(starts.includes("2026-08-11T15:00:00.000Z"));
});

test("touching endpoints do not count as a conflict", () => {
  // A meeting ending exactly at 14:00 leaves the 14:00 slot free.
  const busy = [{ start: new Date("2026-08-11T13:00:00Z"), end: new Date("2026-08-11T14:00:00Z") }];
  const starts = generateSlots(CONFIG, busy, [], NOW).map((s) => s.start.toISOString());
  assert.ok(starts.includes("2026-08-11T14:00:00.000Z"));
});

test("bufferMinutes widens a conflict on both sides", () => {
  const busy = [{ start: new Date("2026-08-11T14:00:00Z"), end: new Date("2026-08-11T15:00:00Z") }];
  const starts = generateSlots({ ...CONFIG, bufferMinutes: 30 }, busy, [], NOW).map((s) =>
    s.start.toISOString()
  );
  // The 13:00 and 15:00 neighbours are now swallowed by the buffer.
  assert.deepEqual(starts.filter((s) => s.startsWith("2026-08-11")), []);
});

test("already-taken slots are excluded (our DB, not the feed, is authoritative)", () => {
  const taken = [{ start: new Date("2026-08-11T13:00:00Z"), end: new Date("2026-08-11T14:00:00Z") }];
  const starts = generateSlots(CONFIG, [], taken, NOW).map((s) => s.start.toISOString());
  assert.ok(!starts.includes("2026-08-11T13:00:00.000Z"));
});

test("no slot is ever offered twice", () => {
  const starts = generateSlots(CONFIG, [], [], NOW).map((s) => s.start.toISOString());
  assert.equal(new Set(starts).size, starts.length);
});

test("winter slots hold their local wall-clock time across DST", () => {
  const winter = new Date("2026-01-05T12:00:00Z"); // Monday in EST
  const slots = generateSlots(CONFIG, [], [], winter);
  // 9:00 ET in January is 14:00Z, not 13:00Z.
  assert.equal(slots[0].start.toISOString(), "2026-01-06T14:00:00.000Z");
});
