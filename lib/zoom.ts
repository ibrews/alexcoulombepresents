// ── Zoom Server-to-Server OAuth client — meeting creation + registrants ────
// Same app as the KB's meeting-digest pipeline (~/.zoom-credentials.json on
// the fleet), scoped up 2026-08-12 with meeting:write:meeting:admin and
// meeting:write:registrant:admin so this app can create meetings and
// register buyers directly instead of buyers self-registering via a link.

import { sql, ensureCommerceSchema } from "./commerce/schema.ts";

const API_BASE = "https://api.zoom.us/v2";

function accountId(): string {
  const id = process.env.ZOOM_ACCOUNT_ID;
  if (!id) throw new Error("ZOOM_ACCOUNT_ID is not set");
  return id;
}

function clientId(): string {
  const id = process.env.ZOOM_CLIENT_ID;
  if (!id) throw new Error("ZOOM_CLIENT_ID is not set");
  return id;
}

function clientSecret(): string {
  const secret = process.env.ZOOM_CLIENT_SECRET;
  if (!secret) throw new Error("ZOOM_CLIENT_SECRET is not set");
  return secret;
}

// No caching — a Server-to-Server token request is cheap and unrestricted
// for this use, and every call site here is a low-frequency webhook/admin
// event, not a hot path worth the complexity of tracking expiry across
// serverless invocations.
async function accessToken(): Promise<string> {
  const auth = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "account_credentials", account_id: accountId() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Zoom oauth/token failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

async function call(method: string, path: string, body?: Record<string, unknown>) {
  const token = await accessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Zoom ${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

// "First Last" → Zoom's required first_name/last_name pair, matching the
// name-splitting convention already used for email templates
// (lib/commerce/email.ts). Zoom rejects an empty last_name, so a single-word
// name falls back to "Member" rather than sending a blank string.
export function splitName(name: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Member", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Member" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// Creates a registration-required meeting and returns its real numeric ID
// alongside the public registration link — the two pieces
// lib/store.ts / the weekly office-hours meeting need, from one call instead
// of Zoom's web scheduling form. startTimeISO must be UTC ("Z"-suffixed);
// Zoom localizes display using the timezone field.
export async function createZoomMeeting(input: {
  topic: string;
  startTimeISO: string;
  durationMinutes: number;
  agenda?: string;
}): Promise<{ meetingId: string; registrationUrl: string; joinUrl: string }> {
  const json = await call("POST", "/users/me/meetings", {
    topic: input.topic,
    type: 2, // scheduled
    start_time: input.startTimeISO,
    duration: input.durationMinutes,
    timezone: "UTC",
    agenda: input.agenda,
    settings: {
      approval_type: 0, // automatically approve registrants
      registration_type: 1, // register once, attend any occurrence (N/A here, but Zoom requires a value)
      waiting_room: false,
    },
  });
  return {
    meetingId: String(json.id),
    registrationUrl: json.registration_url,
    joinUrl: json.join_url,
  };
}

// Registers a buyer/member directly — the buyer never has to click the
// registration link themselves. Best-effort by design: every call site
// treats a failure here as non-fatal (log and move on), the same way a
// Telegram notice hiccup must never fail a real, already-charged purchase
// or a real credit redemption. Returns whether it actually worked so the
// caller can log accordingly.
export async function addZoomRegistrant(
  meetingId: string,
  registrant: { email: string; name?: string | null }
): Promise<boolean> {
  const { firstName, lastName } = splitName(registrant.name);
  try {
    await call("POST", `/meetings/${meetingId}/registrants`, {
      email: registrant.email,
      first_name: firstName,
      last_name: lastName,
    });
    return true;
  } catch (err) {
    console.error(`[zoom] addZoomRegistrant failed for meeting ${meetingId}:`, err);
    return false;
  }
}

const OFFICE_HOURS_PURPOSE = "office_hours";

// Set by scripts/zoom/create-office-hours-meeting.mjs each Friday. Read by
// app/api/admin/credits (POST body {"for":"office_hours"}) at redemption time.
export async function currentOfficeHoursMeetingId(): Promise<string | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT meeting_id FROM zoom_meetings WHERE purpose = ${OFFICE_HOURS_PURPOSE}
  `) as { meeting_id: string }[];
  return rows[0]?.meeting_id ?? null;
}

export async function setOfficeHoursMeetingId(meetingId: string): Promise<void> {
  await ensureCommerceSchema();
  await sql()`
    INSERT INTO zoom_meetings (purpose, meeting_id, updated_at)
    VALUES (${OFFICE_HOURS_PURPOSE}, ${meetingId}, now())
    ON CONFLICT (purpose) DO UPDATE SET meeting_id = EXCLUDED.meeting_id, updated_at = now()
  `;
}
