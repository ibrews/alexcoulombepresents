// ── Booking — slot generation ──────────────────────────────────────────────
// Pure: config + busy intervals + already-taken slots in, bookable slots out.
// No network, no DB, no runtime imports — unit-testable, same split as
// lib/commerce/membershipBilling.ts.

import { wallClockPartsInZone, zonedWallTimeToUtc, type Interval } from "./ics.ts";

export type BookingConfig = {
  timeZone: string;
  slotMinutes: number;
  /** Local wall-clock windows per weekday (0=Sun). "09:00"–"17:00" style. */
  weeklyHours: Partial<Record<number, Array<{ from: string; to: string }>>>;
  /** Don't offer anything sooner than this many hours out — protects against
   * someone booking a slot 10 minutes from now that can't realistically be
   * confirmed and paid for in time. */
  minNoticeHours: number;
  /** How far ahead to offer. */
  horizonDays: number;
  /** Minimum gap to leave around an existing commitment, in minutes. */
  bufferMinutes: number;
};

export type Slot = { start: Date; end: Date };

function parseHHMM(v: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function overlaps(a: Interval, b: Interval): boolean {
  // Touching endpoints are not an overlap: a 10:00–11:00 meeting leaves an
  // 11:00 slot genuinely free.
  return a.start < b.end && b.start < a.end;
}

/**
 * Generates every bookable slot in [now + minNotice, now + horizon].
 *
 * A slot survives when it falls inside a configured weekly window, does not
 * overlap any busy interval (widened by bufferMinutes on both sides), and is
 * not already held by another booking.
 *
 * `taken` is passed separately from `busy` rather than merged by the caller
 * because the two have different trust levels: `busy` comes from an external
 * calendar feed that may lag, while `taken` is our own database and is
 * authoritative. Keeping them distinct means a stale feed can never cause a
 * double-booking — only the DB decides what's already claimed, and a unique
 * index behind it is the real guard.
 */
export function generateSlots(
  config: BookingConfig,
  busy: Interval[],
  taken: Interval[],
  now: Date,
  // How long the booking actually is. Defaults to one grid step, so callers
  // that only ever wanted a single-length slot are unaffected. A longer
  // booking still starts on the same grid — it just has to FIT, which is why
  // the fit check below tests start+duration against the window end rather
  // than assuming one step.
  durationMinutes: number = config.slotMinutes
): Slot[] {
  const slots: Slot[] = [];
  const earliest = new Date(now.getTime() + config.minNoticeHours * 60 * 60 * 1000);
  const latest = new Date(now.getTime() + config.horizonDays * 24 * 60 * 60 * 1000);
  const bufferMs = config.bufferMinutes * 60 * 1000;
  const slotMs = durationMinutes * 60 * 1000;
  const stepMs = config.slotMinutes * 60 * 1000;

  const paddedBusy = busy.map((b) => ({
    start: new Date(b.start.getTime() - bufferMs),
    end: new Date(b.end.getTime() + bufferMs),
  }));

  // Walk local calendar days, not UTC days — a "Tuesday 9am" window has to
  // mean Tuesday where the calendar owner lives, including across DST.
  for (let dayOffset = 0; dayOffset <= config.horizonDays; dayOffset++) {
    const dayInstant = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const parts = wallClockPartsInZone(dayInstant, config.timeZone);
    const windows = config.weeklyHours[parts.weekday] ?? [];

    for (const window of windows) {
      const from = parseHHMM(window.from);
      const to = parseHHMM(window.to);
      if (!from || !to) continue;

      const windowStart = zonedWallTimeToUtc(
        parts.year,
        parts.month,
        parts.day,
        from.hour,
        from.minute,
        config.timeZone
      );
      const windowEnd = zonedWallTimeToUtc(
        parts.year,
        parts.month,
        parts.day,
        to.hour,
        to.minute,
        config.timeZone
      );

      for (let t = windowStart.getTime(); t + slotMs <= windowEnd.getTime(); t += stepMs) {
        const slot = { start: new Date(t), end: new Date(t + slotMs) };
        if (slot.start < earliest || slot.start > latest) continue;
        if (paddedBusy.some((b) => overlaps(slot, b))) continue;
        if (taken.some((b) => overlaps(slot, b))) continue;
        slots.push(slot);
      }
    }
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  // Day-walking can revisit a local day when an offset shift lands twice in
  // the same date; dedupe on start so a slot is never offered twice.
  return slots.filter((s, i) => i === 0 || s.start.getTime() !== slots[i - 1].start.getTime());
}

/** "Wed, Aug 12, 11:00 AM EDT" — one place, so the picker, the emails, and
 * the admin alert can never describe the same slot differently. */
export function formatSlot(start: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(start);
}

/** "Wed, Aug 12" — the day heading in the picker. */
export function formatSlotDay(start: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(start);
}

/** "11:00 AM" — the button label. Split out rather than sliced off formatSlot
 * because Intl's separators vary by locale/ICU version, and string-surgery on
 * a formatted date is how a picker ends up showing a full timestamp on every
 * button. */
export function formatSlotTime(start: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
}
