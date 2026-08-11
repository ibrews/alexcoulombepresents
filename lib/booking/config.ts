// ── Booking — runtime config, calendar fetch, and DB access ────────────────
// The impure half of lib/booking (the pure logic is ics.ts + availability.ts).

import crypto from "node:crypto";
import { sql, ensureCommerceSchema } from "@/lib/commerce/schema";
import { busyIntervalsFromIcs, type Interval } from "./ics";
import { type BookingConfig } from "./availability";

export const BOOKING_TIMEZONE = "America/New_York";
export const BOOKING_PRICE_CENTS = 20000; // matches consultationDropIn in lib/store.ts
export const BOOKING_DURATION_MINUTES = 60;
/** How long a confirmed slot stays held before the requester loses it. Long
 * enough to survive a night's sleep and a timezone, short enough that a flake
 * doesn't block a slot for a week. */
export const HOLD_HOURS = 48;

// Offered windows, local to BOOKING_TIMEZONE. Wednesdays are deliberately
// absent: that's the weekly class slot (lib/store.ts's wednesdayCalendar).
export const bookingConfig: BookingConfig = {
  timeZone: BOOKING_TIMEZONE,
  slotMinutes: BOOKING_DURATION_MINUTES,
  weeklyHours: {
    1: [{ from: "13:00", to: "17:00" }], // Mon
    2: [{ from: "13:00", to: "17:00" }], // Tue
    4: [{ from: "13:00", to: "17:00" }], // Thu
    5: [{ from: "10:00", to: "16:00" }], // Fri
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
  hold_expires_at: string | null;
  stripe_session_id: string | null;
};

/**
 * Fetches the calendar's busy blocks. Returns null — not an empty array — on
 * any failure, so callers can tell "the calendar says you're free" apart from
 * "the calendar is unreachable". Treating a fetch failure as an empty busy
 * list would offer every slot in the working week during an outage.
 */
export async function fetchBusyIntervals(
  windowStart: Date,
  windowEnd: Date
): Promise<Interval[] | null> {
  const url = process.env.BOOKING_ICS_URL;
  if (!url) {
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
}

/** Slots already claimed by a live booking. Authoritative — unlike the
 * calendar feed, this is our own data. */
export async function takenSlots(from: Date, to: Date): Promise<Interval[]> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT slot_start, slot_end FROM bookings
    WHERE status IN ('requested', 'confirmed', 'paid')
      AND slot_start >= ${from.toISOString()} AND slot_start <= ${to.toISOString()}
  `) as { slot_start: string; slot_end: string }[];
  return rows.map((r) => ({ start: new Date(r.slot_start), end: new Date(r.slot_end) }));
}

export async function createBookingRequest(input: {
  slotStart: Date;
  slotEnd: Date;
  name: string;
  email: string;
  note?: string | null;
}): Promise<BookingRow | null> {
  await ensureCommerceSchema();
  const token = crypto.randomBytes(24).toString("base64url");
  try {
    const rows = (await sql()`
      INSERT INTO bookings (token, slot_start, slot_end, name, email, note, price_cents)
      VALUES (${token}, ${input.slotStart.toISOString()}, ${input.slotEnd.toISOString()},
              ${input.name}, ${input.email}, ${input.note ?? null}, ${BOOKING_PRICE_CENTS})
      RETURNING *
    `) as BookingRow[];
    return rows[0] ?? null;
  } catch (err) {
    // bookings_one_live_per_slot — someone else claimed this slot first.
    // Returning null (rather than throwing) lets the route answer 409 with a
    // "pick another time" message instead of a 500.
    if (String((err as { message?: string }).message ?? "").includes("bookings_one_live_per_slot")) {
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
export async function confirmBooking(token: string): Promise<{ row: BookingRow | null; changed: boolean }> {
  await ensureCommerceSchema();
  const holdUntil = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);
  const rows = (await sql()`
    UPDATE bookings
    SET status = 'confirmed', confirmed_at = now(), hold_expires_at = ${holdUntil.toISOString()}
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

export function bookingActionSignature(token: string, action: "confirm" | "decline"): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(`booking:${action}:${token}`).digest("hex");
}

export function bookingActionSignatureValid(
  token: string,
  action: "confirm" | "decline",
  provided: string | null
): boolean {
  if (!provided) return false;
  const expected = bookingActionSignature(token, action);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
