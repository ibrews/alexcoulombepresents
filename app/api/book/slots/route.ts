import { NextResponse } from "next/server";
import { generateSlots, formatSlot, formatSlotDay, formatSlotTime } from "@/lib/booking/availability";
import {
  bookingConfig,
  fetchBusyIntervals,
  takenSlots,
  expireStaleHolds,
  BOOKING_TIMEZONE,
  BOOKING_DURATIONS,
  durationForHours,
} from "@/lib/booking/config";

// Open slots for /book.
//
// Availability = configured weekly windows − calendar busy blocks − slots
// already claimed by a live booking. Returns 503 rather than a slot list when
// the calendar feed is unreachable: showing every window during an outage
// would take requests for times that are already committed, and the whole
// point of reading the calendar is to not do that.

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Which block length to price and fit. Longer blocks have fewer valid start
  // times, so the slot list genuinely differs per duration.
  const hoursParam = Number(new URL(req.url).searchParams.get("hours") ?? "1");
  const duration = durationForHours(hoursParam) ?? BOOKING_DURATIONS[0];

  const now = new Date();
  const horizonEnd = new Date(now.getTime() + bookingConfig.horizonDays * 24 * 60 * 60 * 1000);

  // Self-healing: a confirmed-but-unpaid hold that lapsed frees its slot here,
  // so this needs no cron of its own.
  try {
    const expired = await expireStaleHolds();
    if (expired > 0) console.log(`[booking] expired ${expired} stale hold(s)`);
  } catch (err) {
    console.error("[booking] hold expiry failed", err);
  }

  const [busy, taken] = await Promise.all([
    fetchBusyIntervals(now, horizonEnd),
    takenSlots(now, horizonEnd).catch((err) => {
      console.error("[booking] taken-slot lookup failed", err);
      return null;
    }),
  ]);

  if (busy === null || taken === null) {
    return NextResponse.json(
      {
        error:
          "Can't read the calendar right now, so I'd rather not offer you a time I might not have. Email info@alexcoulombepresents.com and we'll sort it directly.",
      },
      { status: 503 }
    );
  }

  const slots = generateSlots(bookingConfig, busy, taken, now, duration.minutes);
  return NextResponse.json({
    timeZone: BOOKING_TIMEZONE,
    priceCents: duration.priceCents,
    durationMinutes: duration.minutes,
    hours: duration.hours,
    durations: BOOKING_DURATIONS.map((d) => ({
      hours: d.hours,
      label: d.label,
      priceCents: d.priceCents,
    })),
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      label: formatSlot(s.start, BOOKING_TIMEZONE),
      day: formatSlotDay(s.start, BOOKING_TIMEZONE),
      time: formatSlotTime(s.start, BOOKING_TIMEZONE),
    })),
  });
}
