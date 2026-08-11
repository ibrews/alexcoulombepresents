// ── Booking — iCalendar (.ics) busy-block parsing ──────────────────────────
// Pure: text in, busy intervals out. No network, no runtime imports, so it
// unit-tests against recorded calendar exports — same split as
// lib/commerce/membershipBilling.ts.
//
// An ICS feed is used rather than the Google Calendar API because it needs
// one env var (the calendar's secret iCal URL) instead of a Cloud project,
// service account, and token rotation, and it works identically for Google,
// Apple, or anything Zoom syncs into. See BOOKING_ICS_URL in lib/booking/
// config.ts.
//
// SUPPORTED: VEVENT DTSTART/DTEND (UTC, floating, and TZID forms), all-day
// events, and recurrence for FREQ=DAILY/WEEKLY including INTERVAL, COUNT,
// UNTIL, BYDAY, and EXDATE.
//
// NOT SUPPORTED, deliberately: FREQ=MONTHLY/YEARLY recurrence (counted once,
// at its first occurrence), RDATE, and per-instance RECURRENCE-ID overrides.
// Every one of those failure modes makes us OVER-offer availability — a slot
// is shown that the calendar is actually busy for — which the manual
// confirmation step in this booking flow catches before anyone is charged. An
// unsupported rule can never cause a double-booking on its own; the worst it
// costs is one extra decline.

export type Interval = { start: Date; end: Date };

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Unfolds RFC 5545 line continuations: a CRLF followed by a space or tab is
 * a wrapped line, not a new one. Calendars wrap at 75 octets, so long
 * RRULE/EXDATE lines routinely arrive split — parsing without unfolding
 * silently drops half a recurrence rule. */
function unfold(ics: string): string[] {
  return ics.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

/** Parses an iCalendar date-time into a real instant.
 *
 * Three shapes appear in the wild:
 *   20260812T150000Z  — UTC, unambiguous
 *   20260812T110000   — "floating"/TZID local time
 *   20260812          — all-day (VALUE=DATE)
 *
 * Floating and TZID values are interpreted in `fallbackZone`. This is an
 * approximation: no tz database ships here, so a TZID naming some other zone
 * is read as if it were the local one. For busy-block subtraction that is the
 * safe direction — a mis-zoned block still blocks roughly the right part of
 * the day, and any error surfaces as an extra decline rather than an
 * overbooking.
 */
export function parseIcsDate(value: string, fallbackZone: string): Date | null {
  const v = value.trim();
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return zonedWallTimeToUtc(Number(y), Number(m), Number(d), 0, 0, fallbackZone);
  }
  const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(v);
  if (!dt) return null;
  const [, y, m, d, hh, mm, ss, z] = dt;
  if (z) return new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
  return zonedWallTimeToUtc(+y, +m, +d, +hh, +mm, fallbackZone);
}

/**
 * Converts a wall-clock time in an IANA zone to the correct UTC instant.
 *
 * Done without a tz library: guess that the wall time is UTC, ask Intl what
 * that instant looks like in the target zone, and correct by the difference.
 * One correction is enough for every real zone offset, and it stays right
 * across DST because Intl resolves the offset for that specific instant
 * rather than applying a fixed number.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asSeenInZone = wallClockPartsInZone(new Date(guess), timeZone);
  const seen = Date.UTC(
    asSeenInZone.year,
    asSeenInZone.month - 1,
    asSeenInZone.day,
    asSeenInZone.hour,
    asSeenInZone.minute,
    0
  );
  return new Date(guess + (guess - seen));
}

export function wallClockPartsInZone(
  instant: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  // hour12:false still yields "24" at midnight in some ICU versions.
  const hour = Number(get("hour")) % 24;
  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName.slice(0, 3)),
  };
}

type RawEvent = { start: Date; end: Date; rrule?: string; exdates: Date[] };

/** Splits "DTSTART;TZID=America/New_York:20260812T110000" into its property
 * parameters and value. */
function splitProperty(line: string): { name: string; params: string; value: string } | null {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const head = line.slice(0, colon);
  const semi = head.indexOf(";");
  return {
    name: (semi === -1 ? head : head.slice(0, semi)).toUpperCase(),
    params: semi === -1 ? "" : head.slice(semi + 1),
    value: line.slice(colon + 1),
  };
}

/** Expands one event's recurrence into concrete busy intervals within
 * [windowStart, windowEnd]. Non-recurring events yield at most themselves. */
function expand(event: RawEvent, windowStart: Date, windowEnd: Date, zone: string): Interval[] {
  const durationMs = Math.max(0, event.end.getTime() - event.start.getTime());
  const out: Interval[] = [];
  const excluded = new Set(event.exdates.map((d) => d.getTime()));

  const push = (start: Date) => {
    const end = new Date(start.getTime() + durationMs);
    if (excluded.has(start.getTime())) return;
    if (end <= windowStart || start >= windowEnd) return;
    out.push({ start, end });
  };

  if (!event.rrule) {
    push(event.start);
    return out;
  }

  const rule: Record<string, string> = {};
  for (const part of event.rrule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) rule[k.toUpperCase()] = v;
  }
  const freq = (rule.FREQ ?? "").toUpperCase();
  if (freq !== "DAILY" && freq !== "WEEKLY") {
    // Documented limitation — count it once so the event still blocks its
    // first occurrence rather than disappearing entirely.
    push(event.start);
    return out;
  }

  const interval = Math.max(1, Number.parseInt(rule.INTERVAL ?? "1", 10) || 1);
  const count = rule.COUNT ? Number.parseInt(rule.COUNT, 10) : null;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, zone) : null;
  const byDay = rule.BYDAY
    ? rule.BYDAY.split(",")
        .map((d) => WEEKDAY_INDEX[d.trim().slice(-2).toUpperCase()])
        .filter((n) => n !== undefined)
    : null;

  const hardStop = until && until < windowEnd ? until : windowEnd;
  let emitted = 0;
  // Step day by day rather than by period: it keeps BYDAY handling trivial and
  // the windows here are weeks, not years.
  const stepDays = freq === "DAILY" ? interval : 1;
  for (
    let cursor = new Date(event.start.getTime());
    cursor <= hardStop && (count === null || emitted < count);
    cursor = new Date(cursor.getTime() + stepDays * DAY_MS)
  ) {
    if (freq === "WEEKLY") {
      const weeksElapsed = Math.floor((cursor.getTime() - event.start.getTime()) / (7 * DAY_MS));
      if (weeksElapsed % interval !== 0) continue;
      if (byDay) {
        const weekday = wallClockPartsInZone(cursor, zone).weekday;
        if (!byDay.includes(weekday)) continue;
      } else if (
        wallClockPartsInZone(cursor, zone).weekday !== wallClockPartsInZone(event.start, zone).weekday
      ) {
        continue;
      }
    }
    emitted++;
    push(cursor);
  }
  return out;
}

/**
 * Extracts busy intervals overlapping [windowStart, windowEnd] from an ICS
 * document. Events marked TRANSPARENT (Google's "free" availability) are
 * skipped — they are on the calendar but explicitly not busy — as are
 * CANCELLED ones.
 */
export function busyIntervalsFromIcs(
  ics: string,
  windowStart: Date,
  windowEnd: Date,
  zone: string
): Interval[] {
  const lines = unfold(ics);
  const intervals: Interval[] = [];

  let inEvent = false;
  let start: Date | null = null;
  let end: Date | null = null;
  let rrule: string | undefined;
  let exdates: Date[] = [];
  let transparent = false;
  let cancelled = false;
  let allDay = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      start = end = null;
      rrule = undefined;
      exdates = [];
      transparent = cancelled = allDay = false;
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (inEvent && start && !transparent && !cancelled) {
        // All-day events carry an exclusive DTEND; with no DTEND at all, a
        // dated event is a point in time and an all-day one covers its day.
        const resolvedEnd = end ?? new Date(start.getTime() + (allDay ? DAY_MS : 0));
        intervals.push(...expand({ start, end: resolvedEnd, rrule, exdates }, windowStart, windowEnd, zone));
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const prop = splitProperty(trimmed);
    if (!prop) continue;
    switch (prop.name) {
      case "DTSTART":
        allDay = /VALUE=DATE(?!-)/i.test(prop.params);
        start = parseIcsDate(prop.value, zone);
        break;
      case "DTEND":
        end = parseIcsDate(prop.value, zone);
        break;
      case "RRULE":
        rrule = prop.value;
        break;
      case "EXDATE":
        for (const v of prop.value.split(",")) {
          const d = parseIcsDate(v, zone);
          if (d) exdates.push(d);
        }
        break;
      case "TRANSP":
        transparent = prop.value.trim().toUpperCase() === "TRANSPARENT";
        break;
      case "STATUS":
        cancelled = prop.value.trim().toUpperCase() === "CANCELLED";
        break;
    }
  }
  return intervals;
}
