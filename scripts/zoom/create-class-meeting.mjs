#!/usr/bin/env node
/**
 * Create a registration-required Zoom meeting for a dated class and print
 * the two lines to paste into lib/store.ts's wednesdayCalendarItem() call —
 * replaces creating the meeting by hand in Zoom's web scheduler.
 *
 * Usage:
 *   node scripts/zoom/create-class-meeting.mjs \
 *     --topic "Intro to VR" --start 2026-09-02T15:00:00Z --duration 90
 *
 * Reads ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET from the
 * environment or .env.local.
 */
import { readFileSync } from "node:fs";
import { createZoomMeeting } from "../../lib/zoom.ts";

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

async function main() {
  loadEnvLocal();
  const topic = arg("topic");
  const start = arg("start");
  const duration = Number(arg("duration") ?? 60);

  if (!topic || !start) {
    console.error(
      'Usage: node scripts/zoom/create-class-meeting.mjs --topic "Name" --start 2026-09-02T15:00:00Z [--duration 90]'
    );
    process.exit(1);
  }
  if (!start.endsWith("Z")) {
    console.error(`--start must be a UTC ISO timestamp ending in "Z", got: ${start}`);
    process.exit(1);
  }

  const { meetingId, registrationUrl, joinUrl } = await createZoomMeeting({
    topic,
    startTimeISO: start,
    durationMinutes: duration,
  });

  console.log(`Created "${topic}" — ${duration}min starting ${start}`);
  console.log(`Join URL (for Alex): ${joinUrl}`);
  console.log();
  console.log("Paste into the wednesdayCalendarItem() call in lib/store.ts:");
  console.log(`    zoomRegistrationUrl: "${registrationUrl}",`);
  console.log(`    zoomMeetingId: "${meetingId}",`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
