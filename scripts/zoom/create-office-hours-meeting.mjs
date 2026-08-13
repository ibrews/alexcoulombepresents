#!/usr/bin/env node
/**
 * Create this week's Friday office-hours Zoom meeting by hand.
 *
 * Normally you do NOT need to run this — app/api/cron/office-hours-meeting
 * does it automatically every morning. This is the manual escape hatch for
 * when you want the meeting to exist right now (or the cron failed and you
 * don't want to wait for tomorrow's run).
 *
 * Usage:
 *   node scripts/zoom/create-office-hours-meeting.mjs
 *
 * Idempotent: if the week's meeting already exists it prints the existing
 * one and creates nothing, exactly like the cron.
 *
 * Reads ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET and DATABASE_URL
 * from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { ensureOfficeHoursMeeting } from "../../lib/zoom.ts";

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

async function main() {
  loadEnvLocal();
  const result = await ensureOfficeHoursMeeting();

  if (!result.created) {
    console.log(`Office hours for ${result.dateISO} already exists — meeting ${result.meetingId}. Nothing to do.`);
    return;
  }
  console.log(`Created office hours for ${result.dateISO}, 1p ET`);
  console.log(`Join URL (for Alex): ${result.joinUrl}`);
  console.log(`Registration URL (for non-member drop-in buyers): ${result.registrationUrl}`);
  console.log(`Meeting ID ${result.meetingId} stored — credit redemptions now register on this week's meeting.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
