import { NextRequest, NextResponse } from "next/server";
import { bookingByToken, BOOKING_TIMEZONE } from "@/lib/booking/config";
import { formatSlot } from "@/lib/booking/availability";

// The payment link from the confirmation email.
//
// This exists as a redirect rather than a Stripe URL in the email itself
// because a Checkout Session expires within 24 hours of creation, and a
// confirmation email routinely gets opened later than that — the link would
// simply be dead. Minting the session on click means the email's link never
// goes stale no matter when it's opened.

export const dynamic = "force-dynamic";

function notice(title: string, detail: string): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:48px 24px;background:#f6f6fa;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;border-top:4px solid #f87171;">
<h1 style="margin:0 0 12px;font-size:20px;color:#292524;">${title}</h1>
<p style="margin:0 0 20px;color:#57534e;line-height:1.6;">${detail}</p>
<a href="/book" style="color:#0d9488;">Pick another time →</a>
</div></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const booking = await bookingByToken(token);
  if (!booking) return notice("Link not found", "We couldn't find that booking.");

  const when = formatSlot(new Date(booking.slot_start), BOOKING_TIMEZONE);

  if (booking.status === "paid") {
    return notice("Already paid", `${when} is booked and paid for — nothing more to do. See you then.`);
  }
  if (booking.status === "declined" || booking.status === "cancelled") {
    return notice("No longer available", `${when} isn't available any more.`);
  }
  if (booking.status === "requested") {
    return notice("Not confirmed yet", `${when} is still awaiting confirmation — you'll get an email once it's reviewed.`);
  }
  if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
    return notice("This hold expired", `The hold on ${when} ran out, so the slot went back up.`);
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return notice("Payments are offline", "Email info@alexcoulombepresents.com and we'll sort it directly.");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.alexcoulombepresents.com";
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${site}/book/thanks?token=${booking.token}`,
    cancel_url: `${site}/book/pay/${booking.token}`,
    customer_email: booking.email,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(booking.price_cents),
    "line_items[0][price_data][product_data][name]": "1-hour consultation with Alex",
    "line_items[0][price_data][product_data][description]": when,
    // The webhook keys off these to mark the right booking paid.
    "metadata[kind]": "booking",
    "metadata[booking_token]": booking.token,
    "automatic_tax[enabled]": "false",
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const session = await res.json();
  if (!res.ok || !session?.url) {
    console.error("[booking] Stripe session creation failed", session?.error ?? res.status);
    return notice("Couldn't start checkout", "Something went wrong on our end — try again, or email info@alexcoulombepresents.com.");
  }
  return NextResponse.redirect(session.url, 303);
}
