#!/usr/bin/env node
/**
 * Create this week's Friday office-hours Zoom meeting (fresh each week —
 * Alex's call, 2026-08-12, over one standing recurring meeting) and store
 * its ID so app/api/admin/credits can auto-register redeemers on it.
 *
 * Usage:
 *   node scripts/zoom/create-office-hours-meeting.mjs
 *   node scripts/zoom/create-office-hours-meeting.mjs --date 2026-08-21
 *
 * Run this once a week, any day up to and including that Friday — with no
 * --date it targets the NEAREST upcoming Friday (today counts if today IS
 * Friday). Fixed at 1p ET / 2 hours, matching lib/store.ts's
 * officeHoursDropIn ("Every Friday, 1p ET" / "Two live hours").
 *
 * Reads ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET and DATABASE_URL
 * from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { createZoomMeeting, setOfficeHoursMeetingId } from "../../lib/zoom.ts";

function loadEnvLocal() {
  try {
    const txt = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — rely on real env */
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// Nearest Friday on-or-after today, as "YYYY-MM-DD". Computed from the UTC
// calendar day the script happens to run on — good enough for a manual
// once-a-week utility; pass --date explicitly if run late at night US time,
// when the UTC day may already have rolled to the next date.
function upcomingFridayISO() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diff = (5 - d.getUTCDay() + 7) % 7; // 5 = Friday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// "1p ET" on a given calendar date → the correct UTC instant, accounting
// for EST/EDT without a date library: ask Intl what New York's offset
// actually is at a same-day instant, then apply it.
function onePmEasternToUTC(dateISO) {
  const sameDayGuess = new Date(`${dateISO}T16:00:00Z`); // always still "today" in NY
  const offsetStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(sameDayGuess)
    .find((p) => p.type === "timeZoneName").value; // "GMT-04:00" or "GMT-05:00"
  const offsetHours = parseInt(offsetStr.replace("GMT", ""), 10); // -4 or -5
  const utcHour = 13 - offsetHours; // 1pm ET expressed in UTC
  return `${dateISO}T${String(utcHour).padStart(2, "0")}:00:00Z`;
}

async function main() {
  loadEnvLocal();
  const dateISO = arg("date") ?? upcomingFridayISO();
  const startTimeISO = onePmEasternToUTC(dateISO);

  const { meetingId, registrationUrl, joinUrl } = await createZoomMeeting({
    topic: `Office Hours — ${dateISO}`,
    startTimeISO,
    durationMinutes: 120,
    agenda: "Drop-in office hours with Alex.",
  });

  await setOfficeHoursMeetingId(meetingId);

  console.log(`Created office hours for ${dateISO}, 1p ET`);
  console.log(`Join URL (for Alex): ${joinUrl}`);
  console.log(`Registration URL (for non-member drop-in buyers): ${registrationUrl}`);
  console.log(`Meeting ID ${meetingId} stored — /api/admin/credits?for=office_hours now uses this week's meeting.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
