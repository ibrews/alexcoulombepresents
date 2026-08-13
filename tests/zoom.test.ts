// ── Zoom registrant name-splitting tests ────────────────────────────────────
// Only the pure logic — createZoomMeeting/addZoomRegistrant hit the real
// Zoom API and are verified manually (see the KB write-up), not here.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { splitName, upcomingFridayISO, onePmEasternToUTC } from "../lib/zoom.ts";

test("a normal two-part name splits on the first space", () => {
  assert.deepEqual(splitName("Jan Solarski"), { firstName: "Jan", lastName: "Solarski" });
});

test("a multi-part name keeps everything after the first word as the last name", () => {
  assert.deepEqual(splitName("Mary Jane Watson"), { firstName: "Mary", lastName: "Jane Watson" });
});

test("a single-word name falls back to a non-empty last name (Zoom rejects blank)", () => {
  assert.deepEqual(splitName("Cher"), { firstName: "Cher", lastName: "Member" });
});

test("null/undefined/empty all fall back to a generic placeholder, never throw", () => {
  assert.deepEqual(splitName(null), { firstName: "Member", lastName: "" });
  assert.deepEqual(splitName(undefined), { firstName: "Member", lastName: "" });
  assert.deepEqual(splitName(""), { firstName: "Member", lastName: "" });
  assert.deepEqual(splitName("   "), { firstName: "Member", lastName: "" });
});

test("collapses extra internal whitespace", () => {
  assert.deepEqual(splitName("  Jan   Solarski  "), { firstName: "Jan", lastName: "Solarski" });
});

// ── Office-hours scheduling ────────────────────────────────────────────────
// "1p ET" is 17:00Z for most of the year and 18:00Z in winter. Getting it
// wrong doesn't throw — it silently schedules the meeting an hour off — so
// both sides of the DST boundary are pinned here.

test("1p ET resolves to 17:00Z during EDT (summer)", () => {
  assert.equal(onePmEasternToUTC("2026-08-21"), "2026-08-21T17:00:00Z");
});

test("1p ET resolves to 18:00Z during EST (winter)", () => {
  assert.equal(onePmEasternToUTC("2026-01-16"), "2026-01-16T18:00:00Z");
});

test("1p ET is correct on the Fridays either side of both DST switches", () => {
  // US DST 2026: starts Sun Mar 8, ends Sun Nov 1.
  assert.equal(onePmEasternToUTC("2026-03-06"), "2026-03-06T18:00:00Z"); // Fri before → EST
  assert.equal(onePmEasternToUTC("2026-03-13"), "2026-03-13T17:00:00Z"); // Fri after  → EDT
  assert.equal(onePmEasternToUTC("2026-10-30"), "2026-10-30T17:00:00Z"); // Fri before → EDT
  assert.equal(onePmEasternToUTC("2026-11-06"), "2026-11-06T18:00:00Z"); // Fri after  → EST
});

test("upcomingFriday finds the same week's Friday from mid-week", () => {
  // Wed 2026-08-12, mid-morning ET.
  assert.equal(upcomingFridayISO(new Date("2026-08-12T15:00:00Z")), "2026-08-14");
});

test("upcomingFriday counts today when today IS Friday", () => {
  assert.equal(upcomingFridayISO(new Date("2026-08-14T14:00:00Z")), "2026-08-14");
});

test("upcomingFriday rolls to next week from Saturday", () => {
  assert.equal(upcomingFridayISO(new Date("2026-08-15T14:00:00Z")), "2026-08-21");
});

// The reason upcomingFridayISO asks Intl for New York's date instead of
// using UTC's: after 8pm ET the UTC calendar has already rolled over, so a
// naive UTC read would skip a day — and on a Friday evening that means
// jumping a whole week ahead to the WRONG meeting date.
test("upcomingFriday uses the New York date, not the UTC date, late in the evening", () => {
  // 2026-08-13T02:00:00Z is still Wednesday Aug 12, 10pm in New York.
  assert.equal(upcomingFridayISO(new Date("2026-08-13T02:00:00Z")), "2026-08-14");
  // Friday 2026-08-14 at 11pm ET is 2026-08-15T03:00Z — still that Friday.
  assert.equal(upcomingFridayISO(new Date("2026-08-15T03:00:00Z")), "2026-08-14");
});
