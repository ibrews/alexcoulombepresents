// ── Booking — runtime config, calendar fetch, and DB access ────────────────
// The impure half of lib/booking (the pure logic is ics.ts + availability.ts).

import crypto from "node:crypto";
import { sql, ensureCommerceSchema } from "@/lib/commerce/schema";
import { busyIntervalsFromIcs, type Interval } from "./ics";
import { type BookingConfig } from "./availability";
// Durations/rates/pricing live in the pure module so they stay unit-testable;
// re-exported here so existing importers of config.ts keep working.
export {
  BOOKING_DURATIONS,
  BOOKING_RATES,
  durationForHours,
  rateById,
  priceFor,
  type BookingDuration,
  type BookingRateId,
} from "./pricing";

export const BOOKING_TIMEZONE = "America/New_York";
/** How long a confirmed block stays held before the requester loses it. Long
 * enough to survive a night's sleep and a timezone, short enough that a flake
 * doesn't block a whole afternoon for a week. */
export const HOLD_HOURS = 48;

// Offered windows, local to BOOKING_TIMEZONE.
//   Wednesday — the weekly class slot (lib/store.ts's wednesdayCalendar).
//   Friday    — office hours (lib/store.ts's officeHoursDropIn, whose Stripe
//               custom field literally asks "Which Friday would you like?").
// Both are deliberately absent. They're committed time that would otherwise
// never appear as busy on a calendar feed until each session is scheduled,
// so leaving them out of the template is the only reliable way to reserve
// them. Longer blocks need a window long enough to hold them: with 13:00–17:00
// the 3-hour option can only start at 13:00 or 14:00, which is intended.
export const bookingConfig: BookingConfig = {
  timeZone: BOOKING_TIMEZONE,
  slotMinutes: 60, // the start-time grid, not the booking length
  weeklyHours: {
    1: [{ from: "13:00", to: "17:00" }], // Mon
    2: [{ from: "13:00", to: "17:00" }], // Tue
    4: [{ from: "13:00", to: "17:00" }], // Thu
  },
  minNoticeHours: 24,
  horizonDays: 21,
  bufferMinutes: 15,
};

export type BookingRow = {
  id: string;
  token: string;
  slot_start: string;
  slot_end: string;
  name: string;
  email: string;
  note: string | null;
  status: string;
  price_cents: number;
  rate: string;
  hold_expires_at: string | null;
  stripe_session_id: string | null;
};

/** Every configured calendar feed. Zoom Scheduler pools several calendars to
 * decide availability, and so must this — a free-looking slot on one account
 * is worthless if another account is booked. BOOKING_ICS_URLS takes a
 * comma-separated list; BOOKING_ICS_URL stays supported as the single-feed
 * spelling. */
function icsUrls(): string[] {
  const many = process.env.BOOKING_ICS_URLS;
  const one = process.env.BOOKING_ICS_URL;
  const raw = many ?? one ?? "";
  return raw
    .split(/[,\n]/)
    .map((u) => u.trim())
    .filter(Boolean);
}

/**
 * Fetches busy blocks from every configured calendar. Returns null — not an
 * empty array — on any failure, so callers can tell "you're free" apart from
 * "the calendar is unreachable". Treating a fetch failure as an empty busy
 * list would offer the whole working week during an outage.
 */
export async function fetchBusyIntervals(
  windowStart: Date,
  windowEnd: Date
): Promise<Interval[] | null> {
  const urls = icsUrls();
  if (urls.length === 0) {
    // No feed configured. Normally that's a hard stop — offering the full
    // working week with no idea what's already committed is how you take a
    // request for a slot you're teaching in. The exception is explicit:
    // BOOKING_ALLOW_NO_CALENDAR=1 says "I know, and I'll catch conflicts when
    // I confirm", which is defensible only because nothing here books or
    // charges anyone without a manual confirmation first. Never make this the
    // silent default.
    if (process.env.BOOKING_ALLOW_NO_CALENDAR === "1") {
      console.warn("[booking] no BOOKING_ICS_URL — offering slots unfiltered by calendar");
      return [];
    }
    return null;
  }
  // ALL feeds must succeed. A partial read is the dangerous case: if the
  // agilelens calendar fails but the other two return, the merged list looks
  // like a perfectly normal set of busy blocks with a whole account's
  // commitments silently missing. Better to say "can't read the calendar"
  // than to offer time that one of three calendars already owns.
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          // Google serves these with long cache headers; we still want the
          // freshest copy the CDN will give us.
          cache: "no-store",
        });
        if (!res.ok) {
          console.error(`[booking] ICS fetch failed: HTTP ${res.status}`);
          return null;
        }
        return busyIntervalsFromIcs(await res.text(), windowStart, windowEnd, BOOKING_TIMEZONE);
      } catch (err) {
        console.error("[booking] ICS fetch failed", err);
        return null;
      }
    })
  );
  if (results.some((r) => r === null)) return null;
  return results.flat() as Interval[];
}

/** Slots already claimed by a live booking. Authoritative — unlike the
 * calendar feed, this is our own data. */
export async function takenSlots(from: Date, to: Date): Promise<Interval[]> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT slot_start, slot_end FROM bookings
    WHERE status IN ('requested', 'confirmed', 'paid')
      -- slot_end > from, not slot_start >= from: a 3-hour block that began an
      -- hour ago still owns the next two, and filtering on start would miss it.
      AND slot_end > ${from.toISOString()} AND slot_start <= ${to.toISOString()}
  `) as { slot_start: string; slot_end: string }[];
  return rows.map((r) => ({ start: new Date(r.slot_start), end: new Date(r.slot_end) }));
}

export async function createBookingRequest(input: {
  slotStart: Date;
  slotEnd: Date;
  name: string;
  email: string;
  note?: string | null;
  priceCents: number;
  rate: string;
}): Promise<BookingRow | null> {
  await ensureCommerceSchema();
  const token = crypto.randomBytes(24).toString("base64url");
  try {
    const rows = (await sql()`
      INSERT INTO bookings (token, slot_start, slot_end, name, email, note, price_cents, rate)
      VALUES (${token}, ${input.slotStart.toISOString()}, ${input.slotEnd.toISOString()},
              ${input.name}, ${input.email}, ${input.note ?? null}, ${input.priceCents}, ${input.rate})
      RETURNING *
    `) as BookingRow[];
    return rows[0] ?? null;
  } catch (err) {
    // bookings_no_overlap — the exclusion constraint rejected this because
    // the block collides with a live booking. Returning null (rather than
    // throwing) lets the route answer 409 with "pick another time" instead
    // of a 500.
    if (String((err as { message?: string }).message ?? "").includes("bookings_no_overlap")) {
      return null;
    }
    throw err;
  }
}

export async function bookingByToken(token: string): Promise<BookingRow | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`SELECT * FROM bookings WHERE token = ${token}`) as BookingRow[];
  return rows[0] ?? null;
}

/** Confirms a requested booking and starts its payment hold. Idempotent: a
 * second confirm is a no-op that still returns the row, so a double-clicked
 * email link can't extend the hold or re-send the email twice. */
export async function confirmBooking(
  token: string,
  // When set, overrides the requester's claimed rate — the "they're not
  // really a student" path. Applied inside the same UPDATE as the status
  // change so a confirmed booking can never be left at the wrong price.
  repriceTo?: { priceCents: number; rate: string }
): Promise<{ row: BookingRow | null; changed: boolean }> {
  await ensureCommerceSchema();
  const holdUntil = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);
  const rows = (await sql()`
    UPDATE bookings
    SET status = 'confirmed', confirmed_at = now(), hold_expires_at = ${holdUntil.toISOString()},
        price_cents = COALESCE(${repriceTo?.priceCents ?? null}, price_cents),
        rate = COALESCE(${repriceTo?.rate ?? null}, rate)
    WHERE token = ${token} AND status = 'requested'
    RETURNING *
  `) as BookingRow[];
  if (rows[0]) return { row: rows[0], changed: true };
  return { row: await bookingByToken(token), changed: false };
}

export async function declineBooking(token: string): Promise<{ row: BookingRow | null; changed: boolean }> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE bookings SET status = 'declined', declined_at = now()
    WHERE token = ${token} AND status IN ('requested', 'confirmed')
    RETURNING *
  `) as BookingRow[];
  if (rows[0]) return { row: rows[0], changed: true };
  return { row: await bookingByToken(token), changed: false };
}

export async function markBookingPaid(token: string, stripeSessionId: string): Promise<BookingRow | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE bookings
    SET status = 'paid', paid_at = now(), stripe_session_id = ${stripeSessionId}
    WHERE token = ${token} AND status <> 'paid'
    RETURNING *
  `) as BookingRow[];
  return rows[0] ?? null;
}

/** Frees slots whose payment hold lapsed. Called from the booking page so it
 * self-heals without needing its own cron. */
export async function expireStaleHolds(): Promise<number> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE bookings SET status = 'expired'
    WHERE status = 'confirmed' AND hold_expires_at IS NOT NULL AND hold_expires_at < now()
    RETURNING id
  `) as { id: string }[];
  return rows.length;
}

// ── Signed admin action links ───────────────────────────────────────────────
// The confirm/decline links land in Alex's email, so they can't carry
// ADMIN_KEY: mail sits in an inbox indefinitely and gets forwarded. These are
// HMACs scoped to one booking and one action, so a leaked link can do exactly
// one thing to one booking and nothing else.

export type BookingAction = "confirm" | "decline" | "confirm_standard";

export function bookingActionSignature(token: string, action: BookingAction): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(`booking:${action}:${token}`).digest("hex");
}

export function bookingActionSignatureValid(
  token: string,
  action: BookingAction,
  provided: string | null
): boolean {
  if (!provided) return false;
  const expected = bookingActionSignature(token, action);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
