import { NextRequest, NextResponse } from "next/server";
import { customerFromSession } from "@/lib/commerce/tokens";
import { getCustomer } from "@/lib/commerce/entitlements";

// Stripe Customer Portal hand-off (business plan §2.2: self-service card
// updates + cancellation, no billing UI to build). POST from the /account
// membership card → create a short-lived portal session on the Stripe REST
// API (same no-SDK pattern as app/api/checkout) → 303 to Stripe.
//
// Requires the customer to have a stripe_customer_id (stored by the
// membership webhook branches) and the portal to be configured once in the
// Stripe Dashboard (Settings → Billing → Customer portal).

export async function POST(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const sessionToken = req.cookies.get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken);
  if (!customerId) return NextResponse.redirect(`${site}/account`, 303);

  const key = process.env.STRIPE_SECRET_KEY;
  const customer = await getCustomer(customerId);
  if (!key || !customer?.stripe_customer_id) {
    return NextResponse.redirect(`${site}/account?portal=unavailable`, 303);
  }

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customer.stripe_customer_id,
      return_url: `${site}/account`,
    }),
  });
  const portal = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !portal.url) {
    console.error("stripe portal error", portal.error?.message);
    return NextResponse.redirect(`${site}/account?portal=unavailable`, 303);
  }
  return NextResponse.redirect(portal.url, 303);
}
