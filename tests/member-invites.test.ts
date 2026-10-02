// ── Member invite sweep tests ───────────────────────────────────────────────
// Pure sweep logic against fake deps — no Zoom, no database.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { runInviteSweep, type InviteDeps } from "../lib/memberInvitesCore.ts";

const NOW = new Date("2026-10-02T12:00:00Z");
const ALWAYS = [{ email: "alex@example.com" }, { email: "ta@example.com" }];

function setup(overrides: Partial<InviteDeps> = {}) {
  const calls: { meetingId: string; emails: string[] }[] = [];
  const deps: InviteDeps = {
    classes: [
      { slug: "past-class", zoomMeetingId: "111", sessionDateISO: "2026-09-30T15:00:00Z" },
      { slug: "next-class", zoomMeetingId: "222", sessionDateISO: "2026-10-07T15:00:00Z" },
      { slug: "later-class", zoomMeetingId: "333", sessionDateISO: "2026-10-14T15:00:00Z" },
      { slug: "no-meeting", sessionDateISO: "2026-10-21T15:00:00Z" },
    ],
    activeMemberContacts: async () => [
      { email: "m1@example.com", name: "M One" },
      { email: "m2@example.com", name: "M Two" },
    ],
    currentOfficeHoursMeetingId: async () => "999",
    ensureZoomRegistrants: async (meetingId, people) => {
      calls.push({ meetingId, emails: people.map((p) => p.email) });
      return { registered: people.map((p) => p.email), skipped: [], failed: [] };
    },
    alwaysInvite: ALWAYS,
    now: () => NOW,
    ...overrides,
  };
  return { deps, calls };
}

test("sweep covers upcoming classes and office hours, skips past and meeting-less classes", async () => {
  const { deps, calls } = setup();
  const { ok, results } = await runInviteSweep(deps);
  assert.equal(ok, true);
  assert.deepEqual(
    calls.map((c) => c.meetingId),
    ["222", "333", "999"]
  );
  const byTarget = Object.fromEntries(results.map((r) => [r.target, r.action]));
  assert.equal(byTarget["past-class"], "past");
  assert.equal(byTarget["no-meeting"], "no-meeting");
  assert.equal(byTarget["office-hours"], "invited");
  // owners + standing attendees + all members on each meeting
  assert.deepEqual(calls[0].emails, ["alex@example.com", "ta@example.com", "m1@example.com", "m2@example.com"]);
});

test("onlyEmails restricts to that member (plus the always-invited contacts)", async () => {
  const { deps, calls } = setup();
  await runInviteSweep(deps, { onlyEmails: ["m2@example.com"] });
  assert.equal(calls.length, 3);
  for (const c of calls) assert.deepEqual(c.emails, ["alex@example.com", "ta@example.com", "m2@example.com"]);
});

test("onlyEmails still works when the member lookup (name enrichment) fails", async () => {
  const { deps, calls } = setup({
    activeMemberContacts: async () => {
      throw new Error("db down");
    },
  });
  const { ok } = await runInviteSweep(deps, { onlyEmails: ["new@example.com"] });
  assert.equal(ok, true);
  assert.ok(calls[0].emails.includes("new@example.com"));
});

test("empty onlyEmails does nothing", async () => {
  const { deps, calls } = setup();
  const { results } = await runInviteSweep(deps, { onlyEmails: [] });
  assert.equal(calls.length, 0);
  assert.equal(results.length, 0);
});

test("no current office hours meeting is reported, not an error", async () => {
  const { deps } = setup({ currentOfficeHoursMeetingId: async () => null });
  const { ok, results } = await runInviteSweep(deps);
  assert.equal(ok, true);
  assert.equal(results.find((r) => r.target === "office-hours")?.action, "no-meeting");
});

test("one meeting failing does not stop the others; failures flip ok", async () => {
  const { deps } = setup({
    ensureZoomRegistrants: async (meetingId) => {
      if (meetingId === "222") throw new Error("zoom 500");
      return { registered: [], skipped: ["x"], failed: meetingId === "333" ? ["bad@example.com"] : [] };
    },
  });
  const { ok, results } = await runInviteSweep(deps);
  assert.equal(ok, false);
  assert.equal(results.find((r) => r.target === "next-class")?.action, "error");
  assert.equal(results.find((r) => r.target === "later-class")?.failed, 1);
  assert.equal(results.find((r) => r.target === "office-hours")?.skipped, 1);
});
