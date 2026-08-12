// ── Booking — durations, rates, and what they cost ─────────────────────────
// Pure: tables and arithmetic, no runtime imports, so it unit-tests directly.
// Split out of config.ts because that file reaches for the database and the
// "@/..." path alias, which makes it unimportable from the plain node test
// runner — and pricing is exactly the part worth pinning with tests.

/**
 * Bookable block lengths and what they cost at the standard rate.
 *
 * These are RESERVED blocks, not metered time: the whole block is held and
 * charged whether or not it all gets used, which is what makes the longer
 * options a discount rather than a risk to carry. The booking page says so in
 * those words — see app/book/page.tsx.
 */
export const BOOKING_DURATIONS = [
  { hours: 1, minutes: 60, priceCents: 30000, label: "1 hour" },
  { hours: 2, minutes: 120, priceCents: 50000, label: "2 hours" },
  { hours: 3, minutes: 180, priceCents: 60000, label: "3 hours" },
] as const;

export type BookingDuration = (typeof BOOKING_DURATIONS)[number];

export function durationForHours(hours: number): BookingDuration | undefined {
  return BOOKING_DURATIONS.find((d) => d.hours === hours);
}

/**
 * A booking's real length, derived from its own timestamps rather than
 * trusted as a separately-stored field.
 *
 * This exists because it used to be computed inline, separately, in the
 * confirm route and the email module — and a THIRD spot (the Stripe payment
 * page) never computed it at all and hardcoded "1-hour consultation with
 * Alex" for every booking regardless of length. Two duplicated copies plus
 * one missing copy is exactly the shape that produces this bug: one
 * authoritative function, used everywhere a length is needed.
 */
export function bookingHours(slotStartIso: string, slotEndIso: string): number {
  return Math.round((new Date(slotEndIso).getTime() - new Date(slotStartIso).getTime()) / 3_600_000);
}

/** "3-hour" — the adjectival form ("a three-hour flight" stays singular
 * "hour" regardless of count), for copy that reads as a description rather
 * than a quantity ("3 hours"/durationForHours(...).label). */
export function hoursAdjective(hours: number): string {
  return `${hours}-hour`;
}

/**
 * Who's paying, and what multiplier applies.
 *
 * Self-declared on the request form and deliberately NOT verified in code —
 * there's no proof-of-enrollment upload and there shouldn't be. The claimed
 * rate is shown in the owner alert before anything is charged, so the existing
 * confirm step is where it gets accepted or corrected (the alert carries a
 * "confirm at the standard price instead" link). That only works because
 * payment comes after confirmation; on a pay-first flow this would have to be
 * a coupon code, which leaks the moment anyone posts it.
 */
export const BOOKING_RATES = [
  { id: "standard", label: "Standard", multiplier: 1 },
  { id: "reduced", label: "Student or freelancer", multiplier: 0.5, note: "50% off" },
] as const;

export type BookingRateId = (typeof BOOKING_RATES)[number]["id"];

export function rateById(id: string): (typeof BOOKING_RATES)[number] | undefined {
  return BOOKING_RATES.find((r) => r.id === id);
}

/**
 * The authoritative price. Always resolved from these tables server-side,
 * never from anything a client sent — otherwise a request could post its own
 * priceCents and book three hours for a dollar.
 *
 * An unrecognized rate falls back to STANDARD, not to the cheapest match:
 * a typo or a stale link should overcharge and get corrected, not silently
 * give away the work.
 */
export function priceFor(duration: BookingDuration, rateId: string): number {
  const rate = rateById(rateId) ?? BOOKING_RATES[0];
  // Rounded to whole cents; every current multiplier divides evenly, but a
  // future one-third-off rate shouldn't produce a fractional charge.
  return Math.round(duration.priceCents * rate.multiplier);
}
