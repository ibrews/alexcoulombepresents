import { NextRequest, NextResponse } from "next/server";
import { storeItems, STORE_LIVE } from "@/lib/store";

// Creates a Stripe Checkout Session for a catalog item.
// Talks to the Stripe REST API directly (form-encoded) — no SDK dependency.
// Stripe takes card processing only; there is no marketplace cut.
//
// Required env (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY        sk_live_... (or sk_test_... while testing)
//   NEXT_PUBLIC_SITE_URL     https://alexcoulombepresents.com
//   NEXT_PUBLIC_STORE_LIVE   "1" to enable checkout buttons

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !STORE_LIVE) {
    return NextResponse.json(
      { error: "Checkout isn't online yet — email info@alexcoulombepresents.com to purchase directly." },
      { status: 503 }
    );
  }

  let slug: string | undefined;
  try {
    ({ slug } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const item = storeItems.find((i) => i.slug === slug);
  if (!item || item.priceCents === null) {
    return NextResponse.json({ error: "Unknown or non-purchasable item" }, { status: 404 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${site}/store/success?item=${item.slug}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/store`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(item.priceCents),
    "line_items[0][price_data][product_data][name]": item.name,
    "line_items[0][price_data][product_data][description]": item.blurb.slice(0, 500),
    "metadata[slug]": item.slug,
    "metadata[fulfillment]": item.fulfillment,
    // Link + cards on by default; ACH can be enabled in the Stripe dashboard
    "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const session = await res.json();
  if (!res.ok) {
    console.error("stripe checkout error", session.error?.message);
    return NextResponse.json({ error: "Payment provider error — try again or email us." }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
