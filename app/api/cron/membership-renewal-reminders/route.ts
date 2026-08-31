import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendDueRenewalReminders, type RenewalReminderDeps } from "@/lib/commerce/renewalReminders";
import {
  activeMembershipsForReminders,
  claimRenewalReminder,
  fetchUpcomingRenewalAmountCents,
} from "@/lib/commerce/membership";
import { sendMembershipRenewalReminder } from "@/lib/commerce/email";
import type { MembershipTierId } from "@/lib/commerce/membershipBilling";

// Warns active members 7 days and 1 day before their subscription renews —
// so a promotional/legacy price expiring, or a base-price change Alex makes
// directly on their Stripe subscription, never lands as a surprise charge.
// Decision logic (who's due, and the once-per-cycle claim) lives in
// lib/commerce/renewalReminders.ts, unit-tested with no database. Same daily
// schedule slot as the site's other crons (vercel.json) — this is
// idempotent per (customer, cycle, kind), so extra runs are cheap no-ops.

export const maxDuration = 30;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function deps(): RenewalReminderDeps {
  return {
    activeMemberships: async () => {
      const rows = await activeMembershipsForReminders();
      return rows.map((r) => ({
        customerId: r.customer_id,
        email: r.email,
        name: r.name,
        tier: r.tier as MembershipTierId,
        updatesUntil: new Date(r.updates_until),
        stripeCustomerId: r.stripe_customer_id,
      }));
    },
    claimReminder: claimRenewalReminder,
    fetchUpcomingRenewalAmountCents,
    sendReminder: (input) => sendMembershipRenewalReminder(input),
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendDueRenewalReminders(deps());
    if (sent.length > 0) {
      console.log(`[membership-renewal-reminders] sent ${sent.length}:`, sent);
    }
    return NextResponse.json({ ok: true, sent: sent.length, details: sent });
  } catch (err) {
    console.error("[membership-renewal-reminders] failed", err);
    return NextResponse.json({ ok: false, error: "renewal reminder run failed" }, { status: 500 });
  }
}
