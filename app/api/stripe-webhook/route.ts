import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// Stripe webhook — fulfillment happens here.
// Configure in Stripe Dashboard → Developers → Webhooks:
//   endpoint: https://alexcoulombepresents.com/api/stripe-webhook
//   events:   checkout.session.completed
// Then set STRIPE_WEBHOOK_SECRET (whsec_...) in the environment.

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  // Reject stale events (>5 min) to prevent replay
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const slug = session.metadata?.slug as string | undefined;
    const fulfillment = session.metadata?.fulfillment as string | undefined;
    const email = session.customer_details?.email as string | undefined;

    // ── Fulfillment bones — wire each branch when the store goes live ──
    switch (fulfillment) {
      case "download-link":
        // TODO(alex): email a signed, expiring download URL for the skill zip
        // (e.g. Vercel Blob or S3 presigned URL). Keep zips out of the repo.
        console.log(`[fulfill] download-link → ${email} for ${slug}`);
        break;
      case "github-invite":
        // TODO(alex): invite buyer to the private repo:
        // gh api repos/ibrews/<repo>/collaborators/<username> -X PUT
        // (collect GitHub username via a post-purchase form on /store/success)
        console.log(`[fulfill] github-invite → ${email} for ${slug}`);
        break;
      case "booking":
        // TODO(alex): send the booking link (Cal.com / Calendly) by email.
        console.log(`[fulfill] booking → ${email} for ${slug}`);
        break;
      default:
        console.log(`[fulfill] manual → ${email} for ${slug}`);
    }
    // TODO(alex): also append every sale to a ledger (Vercel KV / Google Sheet)
    // so fulfillment failures are recoverable.
  }

  return NextResponse.json({ received: true });
}
