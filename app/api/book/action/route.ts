import { NextRequest, NextResponse } from "next/server";
import {
  bookingActionSignatureValid,
  confirmBooking,
  declineBooking,
  bookingByToken,
  durationForHours,
  priceFor,
  type BookingAction,
} from "@/lib/booking/config";
import { sendBookingConfirmedEmail, sendBookingDeclinedEmail } from "@/lib/booking/email";
import { formatSlot } from "@/lib/booking/availability";
import { BOOKING_TIMEZONE } from "@/lib/booking/config";

// One-click confirm/decline from the owner alert email.
//
// Authorized by an HMAC scoped to (booking, action) rather than ADMIN_KEY:
// this URL lives in an inbox forever and may be forwarded, so the worst a
// leaked link can do is confirm or decline the single booking it names.
//
// GET, because it's clicked from a mail client. That means link-prefetchers
// can hit it — which is fine here: both actions are idempotent, neither
// charges anyone, and a decline is reversible by simply booking again.

export const dynamic = "force-dynamic";

function page(title: string, detail: string, ok = true): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:48px 24px;background:#f6f6fa;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border-top:4px solid ${ok ? "#2dd4bf" : "#f87171"};">
<h1 style="margin:0 0 12px;font-size:20px;color:#292524;">${title}</h1>
<p style="margin:0;color:#57534e;line-height:1.6;">${detail}</p>
</div></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const token = params.get("token");
  const action = params.get("action");

  const isAction = (v: string | null): v is BookingAction =>
    v === "confirm" || v === "decline" || v === "confirm_standard";
  if (!token || !isAction(action)) {
    return page("Bad link", "That link is missing something. Check the email again.", false);
  }
  if (!bookingActionSignatureValid(token, action, params.get("sig"))) {
    return page("Bad link", "That link isn't valid. Check the email again.", false);
  }

  const existing = await bookingByToken(token);
  if (!existing) return page("Not found", "No booking matches that link.", false);

  const when = formatSlot(new Date(existing.slot_start), BOOKING_TIMEZONE);

  if (action === "confirm" || action === "confirm_standard") {
    // confirm_standard overrides a self-declared reduced rate. Recomputed
    // from the block's real length rather than trusting the stored price, so
    // it lands on the true standard rate whatever was claimed.
    let reprice: { priceCents: number; rate: string } | undefined;
    if (action === "confirm_standard") {
      const hours = Math.round(
        (new Date(existing.slot_end).getTime() - new Date(existing.slot_start).getTime()) / 3_600_000
      );
      const duration = durationForHours(hours);
      if (duration) reprice = { priceCents: priceFor(duration, "standard"), rate: "standard" };
    }
    const { row, changed } = await confirmBooking(token, reprice);
    if (!row) return page("Not found", "No booking matches that link.", false);
    if (!changed) {
      return page(
        `Already ${row.status}`,
        `Nothing to do — ${when} with ${row.name} is already <strong>${row.status}</strong>.`
      );
    }
    try {
      await sendBookingConfirmedEmail(row);
    } catch (err) {
      console.error("[booking] confirmation email failed", err);
      return page(
        "Confirmed, but the email didn't send",
        `${when} is held for ${row.name}, but the payment email failed to send. Email them directly at ${row.email}.`,
        false
      );
    }
    return page(
      "Confirmed",
      `${row.name} has been emailed a payment link for ${when} at $${(row.price_cents / 100).toFixed(0)}. The slot is held until they pay.`
    );
  }

  const { row, changed } = await declineBooking(token);
  if (!row) return page("Not found", "No booking matches that link.", false);
  if (!changed) {
    return page(`Already ${row.status}`, `Nothing to do — that request is already <strong>${row.status}</strong>.`);
  }
  try {
    await sendBookingDeclinedEmail(row);
  } catch (err) {
    console.error("[booking] decline email failed", err);
    return page("Declined, but the email didn't send", `The slot is free again; ${row.email} wasn't notified.`, false);
  }
  return page("Declined", `${when} is free again and ${row.name} has been told, with a link to pick another time.`);
}
