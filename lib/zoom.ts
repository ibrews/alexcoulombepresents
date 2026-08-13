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

// ── Office hours scheduling — pure date helpers ────────────────────────────
// Exported (and unit-tested) rather than inlined, because "1p ET" is the one
// genuinely error-prone part of this feature: it's 17:00Z for most of the
// year and 18:00Z in winter, and getting it wrong silently schedules the
// meeting an hour off rather than failing loudly.

/** Today's calendar date in New York, "YYYY-MM-DD". */
function newYorkToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Nearest Friday on-or-after today in New York, "YYYY-MM-DD". Today counts
 * if today IS Friday, so a Friday-morning run still targets that same day. */
export function upcomingFridayISO(now: Date = new Date()): string {
  const [y, m, d] = newYorkToday(now).split("-").map(Number);
  // Noon UTC anchor — far enough from either midnight that the arithmetic
  // below can't slip a day regardless of offset.
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));
  anchor.setUTCDate(anchor.getUTCDate() + ((5 - anchor.getUTCDay() + 7) % 7)); // 5 = Friday
  return anchor.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" + 1p New York time → the matching UTC instant, correct
 * across the EDT/EST boundary without pulling in a date library: ask Intl
 * what New York's offset actually is that day, then apply it. */
export function onePmEasternToUTC(dateISO: string): string {
  const sameDayNoonish = new Date(`${dateISO}T16:00:00Z`); // still that date in NY year-round
  const offsetLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  })
    .formatToParts(sameDayNoonish)
    .find((p) => p.type === "timeZoneName")!.value; // "GMT-04:00" | "GMT-05:00"
  const offsetHours = parseInt(offsetLabel.replace("GMT", ""), 10); // -4 | -5
  return `${dateISO}T${String(13 - offsetHours).padStart(2, "0")}:00:00Z`;
}

// ── Office hours meeting — stored current-week pointer ─────────────────────

/** The meeting ID for the week's office hours, whatever it currently is.
 * Read by app/api/admin/credits (POST body {"for":"office_hours"}) at
 * redemption time. */
export async function currentOfficeHoursMeetingId(): Promise<string | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT meeting_id FROM zoom_meetings WHERE purpose = ${OFFICE_HOURS_PURPOSE}
  `) as { meeting_id: string }[];
  return rows[0]?.meeting_id ?? null;
}

/**
 * Create this week's office-hours meeting, or return the existing one if
 * it's already been created for that date.
 *
 * The idempotency is load-bearing, not defensive padding: this runs from a
 * Vercel cron (app/api/cron/office-hours-meeting), and a retried or
 * double-fired cron that blindly created a second meeting would overwrite
 * the stored ID — stranding anyone already registered on the first meeting
 * on a link nobody would ever join. Keyed on the meeting's DATE rather than
 * a timestamp so a re-run any time during the same week is a no-op.
 */
export async function ensureOfficeHoursMeeting(
  now: Date = new Date()
): Promise<{ meetingId: string; dateISO: string; created: boolean; registrationUrl?: string; joinUrl?: string }> {
  await ensureCommerceSchema();
  const dateISO = upcomingFridayISO(now);

  const rows = (await sql()`
    SELECT meeting_id, meeting_date FROM zoom_meetings WHERE purpose = ${OFFICE_HOURS_PURPOSE}
  `) as { meeting_id: string; meeting_date: string | null }[];
  if (rows[0]?.meeting_date === dateISO) {
    return { meetingId: rows[0].meeting_id, dateISO, created: false };
  }

  const meeting = await createZoomMeeting({
    topic: `Office Hours — ${dateISO}`,
    startTimeISO: onePmEasternToUTC(dateISO),
    durationMinutes: 120, // "Two live hours", per lib/store.ts's officeHoursDropIn
    agenda: "Drop-in office hours with Alex.",
  });

  await sql()`
    INSERT INTO zoom_meetings (purpose, meeting_id, meeting_date, updated_at)
    VALUES (${OFFICE_HOURS_PURPOSE}, ${meeting.meetingId}, ${dateISO}, now())
    ON CONFLICT (purpose) DO UPDATE
      SET meeting_id = EXCLUDED.meeting_id, meeting_date = EXCLUDED.meeting_date, updated_at = now()
  `;

  return {
    meetingId: meeting.meetingId,
    dateISO,
    created: true,
    registrationUrl: meeting.registrationUrl,
    joinUrl: meeting.joinUrl,
  };
}
