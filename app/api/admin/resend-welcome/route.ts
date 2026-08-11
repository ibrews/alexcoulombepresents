import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { customerByEmail } from "@/lib/commerce/entitlements";
import { memberTierForCustomer, claimMembershipWelcome } from "@/lib/commerce/membership";
import { sendMembershipWelcomeEmail, sendMembershipOwnerNotification } from "@/lib/commerce/email";
import { issueMagicLink } from "@/lib/commerce/tokens";

// Manual welcome-email recovery for an existing member.
//
// Exists because of the 2026-08-11 incident: the welcome email was gated on
// grantOrExtendMembership's isNew, which the concurrent customer.subscription.
// updated event routinely won, so NO membership signup ever sent its welcome
// or owner alert. The webhook is fixed (welcome now rides the atomic
// claimMembershipWelcome), but already-affected members need a way to be sent
// the email they never got — and any future "did this land?" support request
// needs one that doesn't involve hand-writing the email.
//
// Deliberately calls the same sendMembershipWelcomeEmail the webhook does, so
// a recovery send can never drift from the real thing.
//
//   POST /api/admin/resend-welcome?key=ADMIN_KEY
//        body: {"email":"member@example.com"}          → send only if never welcomed
//        body: {"email":"...", "force": true}          → send even if welcomed_at is set
//
// Without `force` this is safe to re-run: the atomic claim makes a second call
// a no-op rather than a duplicate email.

function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { email?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) return NextResponse.json({ error: "email is required." }, { status: 400 });

  const customer = await customerByEmail(email);
  if (!customer) return NextResponse.json({ error: `No customer for ${email}.` }, { status: 404 });

  // memberTierForCustomer already filters to an active, unexpired membership.
  const tier = await memberTierForCustomer(customer.id);
  if (!tier) {
    return NextResponse.json({ error: `${email} has no active membership.` }, { status: 409 });
  }

  // Take the claim even when forcing, so the row stops looking un-welcomed
  // afterward either way. Without force, losing the claim means someone (or
  // the webhook) already sent it — report that instead of double-sending.
  const claimed = await claimMembershipWelcome(customer.id);
  if (!claimed && !body.force) {
    return NextResponse.json(
      { sent: false, reason: "Already welcomed — pass force:true to send anyway." },
      { status: 409 }
    );
  }

  const magicToken = await issueMagicLink(customer.id);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

  await sendMembershipWelcomeEmail({
    email,
    name: customer.name,
    magicLinkUrl: `${site}/api/account/verify?token=${magicToken}`,
    tier,
  });
  await sendMembershipOwnerNotification({
    email,
    name: customer.name,
    tier,
    amountCents: 0, // recovery send — the real charge already alerted via Stripe
  });

  return NextResponse.json({ sent: true, email, tier, forced: !claimed });
}
