import { NextResponse } from "next/server";
import { generateSlots, formatSlot, formatSlotDay, formatSlotTime } from "@/lib/booking/availability";
import {
  bookingConfig,
  fetchBusyIntervals,
  takenSlots,
  expireStaleHolds,
  BOOKING_TIMEZONE,
  BOOKING_DURATIONS,
  BOOKING_RATES,
  priceFor,
} from "@/lib/booking/config";

// Open slots for /book — every duration's slot list and every rate's price,
// in one response.
//
// Availability = configured weekly windows − calendar busy blocks − slots
// already claimed by a live booking. Returns 503 rather than a slot list when
// the calendar feed is unreachable: showing every window during an outage
// would take requests for times that are already committed, and the whole
// point of reading the calendar is to not do that.
//
// Deliberately NOT parameterized by hours/rate: those used to be query params,
// and the picker refetched this route on every duration or rate click —
// which meant every click re-ran the full calendar fetch, including its 8s +
// 12s retry budget (fetchOneIcsFeed in lib/booking/config.ts) if a feed was
// slow. Rate never affected availability at all, and duration only changes
// which slots FIT, not what's busy — so the one genuinely expensive part
// (reading three calendars) now happens exactly once per page load, and
// switching duration or rate afterward is a client-side array lookup.

export const dynamic = "force-dynamic";
// A single flaky feed can take up to 8s + 12s of retries (see
// fetchOneIcsFeed in lib/booking/config.ts) before this route gives up.
export const maxDuration = 30;

export async function GET() {
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

  return NextResponse.json({
    timeZone: BOOKING_TIMEZONE,
    // Every duration's price at every rate, keyed by rate id, so the picker
    // never needs a round-trip to reprice a combination.
    durations: BOOKING_DURATIONS.map((d) => ({
      hours: d.hours,
      label: d.label,
      minutes: d.minutes,
      standardPriceCents: d.priceCents,
      prices: Object.fromEntries(BOOKING_RATES.map((r) => [r.id, priceFor(d, r.id)])),
    })),
    rates: BOOKING_RATES.map((r) => ({ id: r.id, label: r.label, note: "note" in r ? r.note : null })),
    // Every duration's fitted slot list, keyed by hours. generateSlots is
    // pure/sync — computing it three times against the same busy+taken data
    // is negligible next to the network fetch that produced that data.
    slotsByHours: Object.fromEntries(
      BOOKING_DURATIONS.map((d) => [
        d.hours,
        generateSlots(bookingConfig, busy, taken, now, d.minutes).map((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
          label: formatSlot(s.start, BOOKING_TIMEZONE),
          day: formatSlotDay(s.start, BOOKING_TIMEZONE),
          time: formatSlotTime(s.start, BOOKING_TIMEZONE),
        })),
      ])
    ),
  });
}
