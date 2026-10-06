import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { customerByEmail, findOrCreateCustomer } from "@/lib/commerce/entitlements";
import { grantCompMembership, readMembershipRow } from "@/lib/commerce/membership";
import { renderGiftedMembership, sendGiftedMembershipEmail } from "@/lib/commerce/email";
import { issueMagicLink } from "@/lib/commerce/tokens";
import { inviteMembersToUpcomingSessions } from "@/lib/memberInvites";
import { parseCompRequest, runCompMembership, type CompDeps, type CompEmailInput } from "@/lib/commerce/compMembership";

// Comp a membership — Alex's rule (2026-10-06): every guest instructor gets
// lifetime Insider plus an invite to every class, once they've taught.
// Logic + tests: lib/commerce/compMembership.ts. CLI: scripts/comp-membership.mjs.
//
//   POST /api/admin/comp-membership?key=ADMIN_KEY   (or header x-admin-key)
//   {
//     "email": "instructor@example.com",   required
//     "name": "Jane Doe",                   optional, used in the greeting
//     "tier": "insider",                    default insider
//     "lifetime": true,                     default true unless "months" is given
//     "months": 3,                          a fixed term instead of lifetime
//     "reason": "instructor",               default instructor (picks the email copy)
//     "dryRun": true,                       report what would happen; touch nothing
//     "sendEmail": true,                    default true
//     "force": true                         re-send email + invites even if nothing changed
//   }
//
// Idempotent: the grant is a compare-and-set merge that never shortens or
// downgrades, and only the run that actually changed the row notifies — so a
// second run for the same email is a no-op unless `force` is set.

export const maxDuration = 60;

function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function emailFor(input: CompEmailInput) {
  return {
    email: input.email,
    recipientName: input.name,
    tierId: input.tier,
    until: input.until,
    variant: input.reason === "instructor" ? ("instructor" as const) : ("gift" as const),
    fromName: input.reason === "instructor" ? null : "Alex",
    magicLinkUrl: input.magicLinkUrl,
  };
}

function deps(): CompDeps {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  return {
    findCustomerIdByEmail: async (email) => (await customerByEmail(email))?.id ?? null,
    readMembership: readMembershipRow,
    findOrCreateCustomer,
    grantCompMembership,
    issueMagicLinkUrl: async (customerId) => `${site}/api/account/verify?token=${await issueMagicLink(customerId)}`,
    renderEmail: (input) => renderGiftedMembership(emailFor(input)),
    sendEmail: (input) => sendGiftedMembershipEmail(emailFor(input)),
    // Same gate as the membership webhook: without Zoom credentials the sweep
    // has nothing to talk to.
    inviteToUpcomingSessions: process.env.ZOOM_CLIENT_ID
      ? (email) => inviteMembersToUpcomingSessions({ onlyEmails: [email] })
      : undefined,
  };
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-admin-key");
  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = parseCompRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const result = await runCompMembership(deps(), parsed.req);
    // 207: the grant landed but the email didn't — the body says how to retry.
    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (err) {
    console.error("[comp-membership] failed", err);
    return NextResponse.json(
      { error: `Comp failed before anything was sent: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
