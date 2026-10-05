import test from "node:test";
import assert from "node:assert/strict";
import { upcomingTbdWednesdays } from "../lib/trainingCalendarDates.ts";

const LAST = "2026-09-30T15:00:00Z"; // final class of the Aug–Sep run, 11a ET

test("continues the weekly sequence while the last class is still ahead", () => {
  const now = Date.parse("2026-09-20T12:00:00Z");
  assert.deepEqual(upcomingTbdWednesdays(LAST, 2, now), ["2026-10-07T15:00:00.000Z", "2026-10-14T15:00:00.000Z"]);
});

test("never shows a placeholder date that has already passed", () => {
  const now = Date.parse("2026-10-08T12:00:00Z"); // the day after the Oct 7 slot
  assert.deepEqual(upcomingTbdWednesdays(LAST, 2, now), ["2026-10-14T15:00:00.000Z", "2026-10-21T15:00:00.000Z"]);
});

test("a slot still later today counts as upcoming", () => {
  const now = Date.parse("2026-10-07T14:00:00Z"); // an hour before the Oct 7 slot
  assert.equal(upcomingTbdWednesdays(LAST, 1, now)[0], "2026-10-07T15:00:00.000Z");
});

test("stops at the end of the last class's calendar year", () => {
  const now = Date.parse("2026-12-28T12:00:00Z");
  assert.deepEqual(upcomingTbdWednesdays(LAST, 2, now), ["2026-12-30T15:00:00.000Z"]);
});
