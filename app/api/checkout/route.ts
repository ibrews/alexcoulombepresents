import { NextRequest, NextResponse } from "next/server";
import { storeItems, STORE_LIVE, effectivePriceCents, isPurchasable, officeHoursDropIn } from "@/lib/store";
import { digitalProducts, DIGITAL_LIVE } from "@/lib/commerce/products";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { getSeatsSold } from "@/lib/commerce/seats";
import { MEMBERSHIP_LIVE, membershipTier } from "@/lib/commerce/membership";

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
  if (!(await rateLimitAllows(`checkout:${clientIp(req)}`, 10, 60))) {
    return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Checkout isn't online yet — email info@alexcoulombepresents.com to purchase directly." },
      { status: 503 }
    );
  }

  let payload: { slug?: string; sku?: string; donationCents?: number; membership?: boolean; tier?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  let body: URLSearchParams;

  if (payload.donationCents !== undefined) {
    // ── "Support the Lab" donations (app/support) — no fulfillment, just thanks.
    // Donations work even while the store flags are off; there's nothing to deliver.
    const cents = Math.floor(payload.donationCents);
    if (!Number.isFinite(cents) || cents < 100 || cents > 1_000_000) {
      return NextResponse.json({ error: "Donation must be between $1 and $10,000." }, { status: 400 });
    }
    body = new URLSearchParams({
      mode: "payment",
      success_url: `${site}/support?thanks=1`,
      cancel_url: `${site}/support`,
      submit_type: "donate",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(cents),
      "line_items[0][price_data][product_data][name]": "Support the Lab",
      "line_items[0][price_data][product_data][description]":
        "A donation to keep the experiments coming. Thank you!",
      "metadata[kind]": "donation",
      "custom_fields[0][key]": "comment",
      "custom_fields[0][label][type]": "custom",
      "custom_fields[0][label][custom]": "Comment or request (optional)",
      "custom_fields[0][type]": "text",
      "custom_fields[0][optional]": "true",
      "automatic_tax[enabled]": "false",
    });
  } else if (payload.sku) {
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
      allow_promotion_codes: "true", // promo codes created in the Stripe Dashboard (e.g. newsletter code)
    });
  } else if (payload.membership) {
    // ── Membership subscription (lib/commerce/membership.ts) — recurring,
    // so this is mode=subscription referencing the real Stripe Price object
    // for whichever tier was picked, not inline price_data like the one-time
    // items above. customer_creation is a payment-mode-only param — Stripe
    // always creates a customer for a subscription, so it's omitted here.
    if (!MEMBERSHIP_LIVE) {
      return NextResponse.json({ error: "Membership isn't open yet." }, { status: 503 });
    }
    const tier = membershipTier(payload.tier);
    if (!tier) {
      return NextResponse.json({ error: "Unknown membership tier." }, { status: 400 });
    }
    const priceId = process.env[tier.priceEnvVar];
    if (!priceId) {
      return NextResponse.json({ error: "This tier isn't configured yet." }, { status: 503 });
    }
    body = new URLSearchParams({
      mode: "subscription",
      success_url: `${site}/members?joined=1`,
      cancel_url: `${site}/members`,
      "line_items[0][quantity]": "1",
      "line_items[0][price]": priceId,
      "metadata[kind]": "membership",
      "metadata[tier]": tier.id,
      "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup
    });
  } else {
    if (!STORE_LIVE) {
      return NextResponse.json(
        { error: "Checkout isn't online yet — email info@alexcoulombepresents.com to purchase directly." },
        { status: 503 }
      );
    }
    const item = storeItems.find((i) => i.slug === payload.slug);
    // Only sell what we can actually deliver: a real price, no external
    // storefront handling fulfillment, and (for time-boxed items like the
    // cohort) still inside its sale window. This backstops the UI — a
    // crafted POST for an inquiry-only, Capafy-fulfilled, or already-closed
    // slug must never take money.
    if (!item || !isPurchasable(item)) {
      return NextResponse.json({ error: "Unknown or non-purchasable item" }, { status: 404 });
    }
    // Hard capacity stop — checked server-side regardless of what the store
    // page shows, so a crafted/late POST can never oversell a capped item.
    if (item.capacity !== undefined) {
      let sold = 0;
      try {
        sold = await getSeatsSold(item.slug);
      } catch (err) {
        console.error("[seats] capacity check failed", err);
        return NextResponse.json({ error: "Checkout temporarily unavailable — try again." }, { status: 503 });
      }
      if (sold >= item.capacity) {
        return NextResponse.json({ error: "Sold out" }, { status: 409 });
      }
    }
    const priceCents = effectivePriceCents(item)!;
    const params: Record<string, string> = {
      mode: "payment",
      success_url: `${site}/store/success?item=${item.slug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/store`,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(priceCents),
      "line_items[0][price_data][product_data][name]": item.name,
      "line_items[0][price_data][product_data][description]": item.blurb.slice(0, 500),
      "metadata[slug]": item.slug,
      "metadata[fulfillment]": item.fulfillment,
      "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup
      // Promo codes (vouchers, NEWSLETTER20) — off for premium items (private 1:1).
      allow_promotion_codes: String(item.allowPromoCodes !== false),
    };
    // Office hours isn't date-pinned like the Wednesday calendar — the buyer
    // has to tell us which Friday. Required custom field so the answer lands
    // in the Stripe session itself (readable in the webhook below) instead of
    // relying on a reply-email round-trip.
    if (item.slug === officeHoursDropIn.slug) {
      params["custom_fields[0][key]"] = "preferred_friday";
      params["custom_fields[0][label][type]"] = "custom";
      params["custom_fields[0][label][custom]"] = "Which Friday would you like?";
      params["custom_fields[0][type]"] = "text";
      params["custom_fields[0][optional]"] = "false";
    }
    body = new URLSearchParams(params);
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
