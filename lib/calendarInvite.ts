// ── Real .ics calendar invites — for people Zoom structurally can't invite ──
// Zoom refuses to let a meeting's host register as their own attendee (code
// 3027, "Host can not register") — confirmed live 2026-09-23 trying to
// register alex@agilelens.com (the literal Zoom host login) on the Intro to
// AR meeting. The info@alexcoulombepresents.com alias workaround (a
// different address, so Zoom accepts it) gets Alex A Zoom confirmation, but
// to an inbox he doesn't watch — an owner-alert email with a plain join link
// isn't a calendar invite either (no Accept/Decline, doesn't land on the
// calendar). This builds a real RFC 5545 VEVENT so Resend can attach a
// genuine, one-click-Accept invite for exactly that case.

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function icsUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildClassInviteIcs(input: {
  uid: string; // stable per event — reusing the Zoom meeting id is enough
  summary: string;
  description: string;
  startISO: string; // UTC
  durationMinutes: number;
  joinUrl: string;
  organizerEmail: string;
  attendeeEmail: string;
  attendeeName?: string | null;
}): string {
  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Alex Coulombe Presents//Class Invite//EN",
    "VERSION:2.0",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.uid}@alexcoulombepresents.com`,
    `DTSTAMP:${icsUtcStamp(new Date())}`,
    `DTSTART:${icsUtcStamp(start)}`,
    `DTEND:${icsUtcStamp(end)}`,
    `SUMMARY:${icsEscape(input.summary)}`,
    `DESCRIPTION:${icsEscape(input.description)}`,
    `LOCATION:${icsEscape(input.joinUrl)}`,
    `ORGANIZER;CN=Alex Coulombe Presents:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${icsEscape(input.attendeeName ?? input.attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${input.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
