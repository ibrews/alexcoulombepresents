import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { generateSlots } from "@/lib/booking/availability";
import {
  bookingConfig,
  createBookingRequest,
  fetchBusyIntervals,
  takenSlots,
  durationForHours,
} from "@/lib/booking/config";
import { sendBookingRequestAck, sendBookingOwnerRequest } from "@/lib/booking/email";

// Takes an appointment request. Nobody is charged here — payment happens only
// after the request is confirmed (see /api/book/action).

export async function POST(req: NextRequest) {
  if (!(await rateLimitAllows(`book:${clientIp(req)}`, 5, 60))) {
    return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }

  let payload: { start?: string; name?: string; email?: string; note?: string; hours?: number };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const start = payload.start ? new Date(payload.start) : null;

  if (!name || name.length > 120) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  if (!start || Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Pick a time." }, { status: 400 });
  }
  if ((payload.note?.length ?? 0) > 2000) {
    return NextResponse.json({ error: "That note is a bit long — trim it down?" }, { status: 400 });
  }
  // Price comes from the server-side table keyed by duration, never from the
  // request body — otherwise a client could post its own priceCents and book
  // three hours for a dollar.
  const duration = durationForHours(Number(payload.hours ?? 1));
  if (!duration) return NextResponse.json({ error: "Pick how long you need." }, { status: 400 });

  // Re-derive availability server-side. The slot list the browser rendered
  // may be minutes old, and a client can post any timestamp it likes — so the
  // requested slot has to still be a real, open one right now.
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + bookingConfig.horizonDays * 24 * 60 * 60 * 1000);
  const [busy, taken] = await Promise.all([fetchBusyIntervals(now, horizonEnd), takenSlots(now, horizonEnd)]);
  if (busy === null) {
    return NextResponse.json(
      { error: "Can't reach the calendar right now — try again shortly, or email info@alexcoulombepresents.com." },
      { status: 503 }
    );
  }
  const open = generateSlots(bookingConfig, busy, taken, now, duration.minutes);
  if (!open.some((s) => s.start.getTime() === start.getTime())) {
    return NextResponse.json(
      { error: "That time just went — pick another and it'll go straight through." },
      { status: 409 }
    );
  }

  const booking = await createBookingRequest({
    slotStart: start,
    slotEnd: new Date(start.getTime() + duration.minutes * 60 * 1000),
    name,
    email,
    note: payload.note?.trim() || null,
    priceCents: duration.priceCents,
  });
  // null means the unique index rejected it — someone claimed this slot in the
  // moment between the availability check above and the insert.
  if (!booking) {
    return NextResponse.json(
      { error: "Someone just took that one. Pick another time?" },
      { status: 409 }
    );
  }

  try {
    await sendBookingRequestAck(booking);
  } catch (err) {
    // The row exists and the owner alert below still fires, so the request is
    // not lost — don't fail the submission over a mail hiccup.
    console.error("[booking] requester ack failed", err);
  }
  await sendBookingOwnerRequest(booking);

  return NextResponse.json({ ok: true, token: booking.token });
}
