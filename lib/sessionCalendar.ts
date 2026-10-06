// Calendar plumbing for class pages: human-readable times in New York, a
// prefilled Google Calendar link, and an .ics body. Pure functions so the
// test runner can check DST edges without rendering anything.

import { type ClassSession, sessionEndsISO } from "./classSessions.ts";
import { instructorNames } from "./instructors.ts";

const SITE = "https://alexcoulombepresents.com";

export function sessionUrl(s: ClassSession): string {
  return `${SITE}/classes/${s.slug}`;
}

/** { weekday: "Wed", date: "Oct 21", time: "11am", tz: "EDT" } in New York. */
export function newYorkParts(iso: string): { weekday: string; date: string; time: string; tz: string } {
  const d = new Date(iso);
  const opts = { timeZone: "America/New_York" } as const;
  const weekday = d.toLocaleDateString("en-US", { ...opts, weekday: "short" });
  const date = d.toLocaleDateString("en-US", { ...opts, month: "short", day: "numeric" });
  const time = d
    .toLocaleTimeString("en-US", { ...opts, hour: "numeric", minute: "2-digit" })
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
  const tz =
    new Intl.DateTimeFormat("en-US", { ...opts, timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "ET";
  return { weekday, date, time, tz };
}

/** "Wed, Oct 21 · 11am–1pm ET" */
export function sessionWhen(s: ClassSession): string {
  const start = newYorkParts(s.startsISO);
  const end = newYorkParts(sessionEndsISO(s));
  return `${start.weekday}, ${start.date} · ${start.time}–${end.time} ET`;
}

function compactUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function where(s: ClassSession): string {
  if (s.watchUrl) return s.watchUrl;
  return "Zoom — link arrives after you book";
}

export function googleCalendarUrl(s: ClassSession): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates: `${compactUtc(s.startsISO)}/${compactUtc(sessionEndsISO(s))}`,
    details: `${s.blurb}\n\nWith ${instructorNames(s.instructorIds)}.\n${sessionUrl(s)}`,
    location: where(s),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// RFC 5545 text escaping + 75-octet line folding (approximated by chars,
// which is safe for the ASCII-heavy copy here).
function icsText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string): string {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 73) out.push((i ? " " : "") + line.slice(i, i + 73));
  return out.join("\r\n");
}

export function sessionIcs(s: ClassSession, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alex Coulombe Presents//Classes//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${s.slug}@alexcoulombepresents.com`,
    `DTSTAMP:${compactUtc(now.toISOString())}`,
    `DTSTART:${compactUtc(s.startsISO)}`,
    `DTEND:${compactUtc(sessionEndsISO(s))}`,
    `SUMMARY:${icsText(s.title)}`,
    `DESCRIPTION:${icsText(`${s.blurb}\n\nWith ${instructorNames(s.instructorIds)}.\n${sessionUrl(s)}`)}`,
    `LOCATION:${icsText(where(s))}`,
    `URL:${sessionUrl(s)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
