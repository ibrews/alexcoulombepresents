#!/usr/bin/env node
/**
 * Match every wednesdayCalendar class in lib/store.ts to its real Zoom
 * meeting, and report which ones are missing or wrong.
 *
 * Used first as a one-time backfill (the Wednesday classes predate
 * zoomMeetingId — their meetings were created by hand in Zoom's web UI, so
 * only the registration URL was ever recorded), and afterwards as an audit:
 * a class whose zoomMeetingId doesn't match its zoomRegistrationUrl would
 * silently auto-register buyers onto the WRONG meeting, which is worse than
 * not auto-registering them at all.
 *
 * Matching is exact, not heuristic: it pairs on registration_url, which is
 * the authoritative link between "what lib/store.ts already has" and "which
 * Zoom meeting that is". Topic/date matching would be a guess.
 *
 * Usage:
 *   node scripts/zoom/audit-class-meeting-ids.mjs
 *
 * Prints the lines to paste into lib/store.ts. Never writes to the repo —
 * a wrong ID here is a silent, buyer-visible failure, so the edit stays a
 * deliberate human step.
 *
 * Reads ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET from the
 * environment or .env.local. Needs meeting:read:list_meetings:admin in
 * addition to the write scopes the runtime feature uses.
 */
import { readFileSync } from "node:fs";
import { wednesdayCalendar } from "../../lib/store.ts";

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

async function token() {
  const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "account_credentials", account_id: process.env.ZOOM_ACCOUNT_ID }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`oauth/token failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function api(accessToken, path) {
  const res = await fetch(`https://api.zoom.us/v2${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

async function main() {
  loadEnvLocal();
  const accessToken = await token();

  // Every scheduled + upcoming meeting, paged.
  const meetings = [];
  for (const type of ["scheduled", "upcoming_meetings"]) {
    let nextPageToken = "";
    do {
      const qs = `type=${type}&page_size=300${nextPageToken ? `&next_page_token=${nextPageToken}` : ""}`;
      const page = await api(accessToken, `/users/me/meetings?${qs}`);
      meetings.push(...(page.meetings ?? []));
      nextPageToken = page.next_page_token ?? "";
    } while (nextPageToken);
  }
  // De-dupe: the two list types overlap.
  const byId = new Map(meetings.map((m) => [String(m.id), m]));
  console.log(`Found ${byId.size} distinct meeting(s) on the account.\n`);

  // registration_url only comes back on the per-meeting detail call.
  const byRegistrationUrl = new Map();
  for (const id of byId.keys()) {
    try {
      const detail = await api(accessToken, `/meetings/${id}`);
      if (detail.registration_url) byRegistrationUrl.set(detail.registration_url, String(detail.id));
    } catch (err) {
      console.warn(`  (skipped meeting ${id}: ${err.message})`);
    }
  }

  const classes = wednesdayCalendar.filter((c) => c.zoomRegistrationUrl);
  let missing = 0;
  let wrong = 0;
  let ok = 0;

  for (const c of classes) {
    const real = byRegistrationUrl.get(c.zoomRegistrationUrl);
    if (!real) {
      console.log(`❓ ${c.slug} — no Zoom meeting found matching its registration URL (already past, or deleted?)`);
      missing++;
      continue;
    }
    if (!c.zoomMeetingId) {
      console.log(`➕ ${c.slug} — needs:  zoomMeetingId: "${real}",`);
      missing++;
    } else if (c.zoomMeetingId !== real) {
      console.log(`❌ ${c.slug} — MISMATCH: store has ${c.zoomMeetingId}, real meeting is ${real}`);
      wrong++;
    } else {
      ok++;
    }
  }

  console.log(`\n${ok} correct, ${missing} missing, ${wrong} MISMATCHED.`);
  if (wrong > 0) {
    console.log("A mismatch auto-registers buyers onto the wrong meeting — fix before the next class sells.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
