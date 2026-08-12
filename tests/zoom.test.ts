// ── Zoom registrant name-splitting tests ────────────────────────────────────
// Only the pure logic — createZoomMeeting/addZoomRegistrant hit the real
// Zoom API and are verified manually (see the KB write-up), not here.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { splitName } from "../lib/zoom.ts";

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
