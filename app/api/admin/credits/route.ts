import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { customerByEmail } from "@/lib/commerce/entitlements";
import {
  isMember,
  bookingCreditsForCustomer,
  redeemOldestBookingCredit,
} from "@/lib/commerce/membership";

// Booking-credit redemption — the manual/admin honor system from the
// membership launch checklist (step 4). When a member books a class, Alex
// checks and burns a credit here; Cal.com integration replaces this later
// (business plan §2.7).
//   GET  /api/admin/credits?key=ADMIN_KEY&email=member@example.com
//        → membership status + full credit history for that member
//   POST /api/admin/credits?key=ADMIN_KEY   body: {"email":"member@example.com"}
//        → redeems the member's soonest-expiring available credit

// Constant-time key check (hash both sides so lengths always match) —
// mirrors app/api/admin/signups/route.ts.
function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function available(credits: Awaited<ReturnType<typeof bookingCreditsForCustomer>>): number {
  const now = Date.now();
  return credits.filter(
    (c) => c.status === "active" && (!c.updates_until || new Date(c.updates_until).getTime() > now)
  ).length;
}

export async function GET(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  try {
    const customer = await customerByEmail(email);
    if (!customer) return NextResponse.json({ error: "No customer with that email." }, { status: 404 });
    const [member, credits] = await Promise.all([
      isMember(customer.id),
      bookingCreditsForCustomer(customer.id),
    ]);
    return NextResponse.json({
      email: customer.email,
      name: customer.name,
      member,
      creditsAvailable: available(credits),
      credits: credits.map((c) => ({
        id: c.id,
        status: c.status,
        expires: c.updates_until,
        minted: c.created_at,
        redeemedAt: c.status === "redeemed" ? c.revoked_at : null,
      })),
    });
  } catch (err) {
    console.error("Admin credits lookup error:", err);
    return NextResponse.json({ error: "Query failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!body.email) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  try {
    const customer = await customerByEmail(body.email);
    if (!customer) return NextResponse.json({ error: "No customer with that email." }, { status: 404 });
    const redeemedId = await redeemOldestBookingCredit(customer.id);
    if (redeemedId === null) {
      return NextResponse.json({ error: "No available credits to redeem." }, { status: 409 });
    }
    const credits = await bookingCreditsForCustomer(customer.id);
    return NextResponse.json({ redeemedId, creditsAvailable: available(credits) });
  } catch (err) {
    console.error("Admin credits redeem error:", err);
    return NextResponse.json({ error: "Redeem failed." }, { status: 500 });
  }
}
