import { NextRequest, NextResponse } from "next/server";
import { storeItems, STORE_LIVE } from "@/lib/store";
import { digitalProducts, DIGITAL_LIVE } from "@/lib/commerce/products";

// Creates a Stripe Checkout Session for a catalog item.
// Talks to the Stripe REST API directly (form-encoded) — no SDK dependency.
// Stripe takes card processing only; there is no marketplace cut.
// Apple Pay / Google Pay / Link appear automatically on Checkout once the
// domain is registered in the Stripe Dashboard (Settings → Payment methods →
// Apple Pay → Add a new domain) — no extra params needed here.
//
// Required env (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY              sk_live_... (or sk_test_... while testing)
//   NEXT_PUBLIC_SITE_URL           https://alexcoulombepresents.com
//   NEXT_PUBLIC_STORE_LIVE         "1" to enable manual-fulfillment items
//   NEXT_PUBLIC_DIGITAL_STORE_LIVE "1" to enable digital-license items
//
// Body is either { slug } (manual-fulfillment catalog, lib/store.ts) or
// { sku } (automated license+download catalog, lib/commerce/products.ts).

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Checkout isn't online yet — email info@alexcoulombepresents.com to purchase directly." },
      { status: 503 }
    );
  }

  let payload: { slug?: string; sku?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  let body: URLSearchParams;

  if (payload.sku) {
    if (!DIGITAL_LIVE) {
      return NextResponse.json({ error: "This item isn't on sale yet." }, { status: 503 });
    }
    const product = digitalProducts.find((p) => p.sku === payload.sku);
    if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 404 });

    body = new URLSearchParams({
      mode: "payment",
      success_url: `${site}/store/success?sku=${product.sku}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/store`,
      customer_creation: "always",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(product.priceCents),
      "line_items[0][price_data][product_data][name]": product.name,
      "line_items[0][price_data][product_data][description]": product.blurb.slice(0, 500),
      "metadata[sku]": product.sku,
      "metadata[kind]": "digital",
      "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup (see business plan §2.8)
    });
  } else {
    if (!STORE_LIVE) {
      return NextResponse.json(
        { error: "Checkout isn't online yet — email info@alexcoulombepresents.com to purchase directly." },
        { status: 503 }
      );
    }
    const item = storeItems.find((i) => i.slug === payload.slug);
    if (!item || item.priceCents === null) {
      return NextResponse.json({ error: "Unknown or non-purchasable item" }, { status: 404 });
    }
    body = new URLSearchParams({
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
      "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup
    });
  }

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
