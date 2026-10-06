// ── Comped memberships — admin endpoint orchestration ───────────────────────
// Alex's rule (2026-10-06): every guest instructor gets lifetime access to the
// top tier (Insider) plus an invite to every class, once they have taught.
// POST /api/admin/comp-membership (and scripts/comp-membership.mjs, which
// calls it) runs this. Pure: all I/O arrives via deps, so the "re-run sends
// nothing" and "dryRun touches nothing" guarantees are unit-tested.

import type { MembershipTierId } from "./membershipBilling";
import { isValidEmail } from "../email.ts";
import {
  addMonthsUTC,
  planMembershipGrant,
  type ExistingMembership,
  type MembershipGrantPlan,
  type MembershipGrantResult,
} from "./membershipGrants.ts";
import type { RenderedEmail } from "./giftEmailCopy.ts";

const TIERS: MembershipTierId[] = ["starter", "unlimited", "insider"];
const MAX_COMP_MONTHS = 120;

export type CompRequest = {
  email: string;
  name: string | null;
  tier: MembershipTierId;
  /** null = lifetime */
  months: number | null;
  reason: string;
  dryRun: boolean;
  sendEmail: boolean;
  force: boolean;
};

export function parseCompRequest(body: unknown): { ok: true; req: CompRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be a JSON object." };
  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!email || !isValidEmail(email)) return { ok: false, error: "email is required and must be a valid address." };

  const tier = (b.tier ?? "insider") as MembershipTierId;
  if (!TIERS.includes(tier)) return { ok: false, error: `tier must be one of ${TIERS.join(", ")}.` };

  // Lifetime unless a term is given — passing both is a contradiction, not a
  // preference, so it's refused rather than silently picking one.
  const lifetime = b.lifetime === undefined ? b.months === undefined : b.lifetime === true;
  let months: number | null = null;
  if (lifetime) {
    if (b.months !== undefined) return { ok: false, error: "Pass either lifetime:true or months, not both." };
  } else {
    const m = Number(b.months);
    if (!Number.isInteger(m) || m < 1 || m > MAX_COMP_MONTHS) {
      return { ok: false, error: `months must be a whole number from 1 to ${MAX_COMP_MONTHS} when lifetime is false.` };
    }
    months = m;
  }

  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 100) : null;
  const reason = typeof b.reason === "string" && b.reason.trim() ? b.reason.trim() : "instructor";
  return {
    ok: true,
    req: {
      email,
      name,
      tier,
      months,
      reason,
      dryRun: b.dryRun === true,
      sendEmail: b.sendEmail !== false,
      force: b.force === true,
    },
  };
}

export type CompEmailInput = {
  email: string;
  name: string | null;
  tier: MembershipTierId;
  until: Date | null;
  reason: string;
  magicLinkUrl: string;
};

export type CompDeps = {
  // Read-only lookups — the only DB access a dryRun is allowed.
  findCustomerIdByEmail(email: string): Promise<number | null>;
  readMembership(customerId: number): Promise<ExistingMembership | null>;
  // Writes.
  findOrCreateCustomer(email: string, name?: string | null): Promise<number>;
  grantCompMembership(
    customerId: number,
    tier: MembershipTierId,
    until: Date | null,
    source: "comp" | "gift"
  ): Promise<MembershipGrantResult>;
  issueMagicLinkUrl(customerId: number): Promise<string>;
  renderEmail(input: CompEmailInput): RenderedEmail;
  sendEmail(input: CompEmailInput): Promise<void>;
  /** Absent when Zoom isn't configured. */
  inviteToUpcomingSessions?(email: string): Promise<{ ok: boolean }>;
  now?(): Date;
};

export type CompResult = {
  ok: boolean;
  dryRun: boolean;
  email: string;
  reason: string;
  requested: { tier: MembershipTierId; lifetime: boolean; until: string | null };
  customer: { id: number | null; existed: boolean };
  grant: {
    action: MembershipGrantPlan["action"];
    changed: boolean;
    tier: string;
    until: string | null;
    keptHigherTier: boolean;
    keptLongerDate: boolean;
  };
  notification: { sent: boolean; skipped?: string; error?: string; subject?: string; text?: string };
  invites: { ran: boolean; ok?: boolean; skipped?: string; error?: string };
  warnings: string[];
};

const DRY_RUN_LINK = "[magic sign-in link, issued at send time]";

function summarize(plan: MembershipGrantPlan, changed: boolean): CompResult["grant"] {
  return {
    action: plan.action,
    changed,
    tier: plan.tier,
    until: plan.until?.toISOString() ?? null,
    keptHigherTier: plan.keptHigherTier,
    keptLongerDate: plan.keptLongerDate,
  };
}

function warningsFor(plan: MembershipGrantPlan): string[] {
  const warnings: string[] = [];
  if (plan.activeSubscription) {
    warnings.push(
      "They also have a live paid Stripe subscription, which keeps billing. If this comp replaces it, cancel " +
        "the subscription in the Stripe Dashboard" +
        (plan.until === null ? " (a lifetime comp is unaffected by the cancellation)." : ".")
    );
  }
  if (plan.keptHigherTier) warnings.push(`They already hold a higher tier (${plan.tier}); kept it.`);
  if (plan.keptLongerDate) warnings.push("They already had access running longer than this; kept the later date.");
  return warnings;
}

export async function runCompMembership(deps: CompDeps, req: CompRequest): Promise<CompResult> {
  const now = deps.now?.() ?? new Date();
  const until = req.months === null ? null : addMonthsUTC(now, req.months);
  const base = {
    email: req.email,
    reason: req.reason,
    requested: { tier: req.tier, lifetime: until === null, until: until?.toISOString() ?? null },
  };

  if (req.dryRun) {
    const existingId = await deps.findCustomerIdByEmail(req.email);
    const existing = existingId === null ? null : await deps.readMembership(existingId);
    const plan = planMembershipGrant(existing, { tier: req.tier, until, source: "comp" }, now);
    // Mirrors the real run's gate below: an unchanged grant notifies nobody
    // unless forced.
    const wouldAct = plan.action !== "unchanged" || req.force;
    const preview = deps.renderEmail({
      email: req.email,
      name: req.name,
      tier: plan.tier as MembershipTierId,
      until: plan.until,
      reason: req.reason,
      magicLinkUrl: DRY_RUN_LINK,
    });
    return {
      ok: true,
      dryRun: true,
      ...base,
      customer: { id: existingId, existed: existingId !== null },
      grant: summarize(plan, plan.action !== "unchanged"),
      notification: {
        sent: false,
        skipped: !req.sendEmail
          ? "sendEmail:false"
          : wouldAct
            ? "dry run"
            : "nothing would change (pass force:true to send anyway)",
        subject: preview.subject,
        text: preview.text,
      },
      invites: {
        ran: false,
        skipped: !wouldAct ? "nothing would change" : deps.inviteToUpcomingSessions ? "dry run" : "Zoom is not configured",
      },
      warnings: warningsFor(plan),
    };
  }

  const existingId = await deps.findCustomerIdByEmail(req.email);
  const customerId = existingId ?? (await deps.findOrCreateCustomer(req.email, req.name));
  const result = await deps.grantCompMembership(customerId, req.tier, until, "comp");
  console.log(
    `[comp-membership] ${req.email} (${req.reason}): ${result.plan.action} → ${result.plan.tier} until ${result.plan.until?.toISOString() ?? "lifetime"}`
  );

  const out: CompResult = {
    ok: true,
    dryRun: false,
    ...base,
    customer: { id: customerId, existed: existingId !== null },
    grant: summarize(result.plan, result.changed),
    notification: { sent: false },
    invites: { ran: false },
    warnings: warningsFor(result.plan),
  };

  // `changed` is the once-only claim: of any number of identical (or
  // concurrent) runs, exactly one actually moved the row, and only that one
  // notifies. A re-run is a no-op unless `force` asks to re-send.
  if (!result.changed && !req.force) {
    out.notification.skipped = "already granted, nothing changed (pass force:true to re-send the email and invites)";
    out.invites.skipped = "already granted";
    return out;
  }

  if (!req.sendEmail) {
    out.notification.skipped = "sendEmail:false";
  } else {
    const emailInput: CompEmailInput = {
      email: req.email,
      name: req.name,
      tier: result.plan.tier as MembershipTierId,
      until: result.plan.until,
      reason: req.reason,
      magicLinkUrl: "",
    };
    try {
      emailInput.magicLinkUrl = await deps.issueMagicLinkUrl(customerId);
      await deps.sendEmail(emailInput);
      out.notification.sent = true;
    } catch (err) {
      // The grant already landed; failing the request would only invite a
      // confused retry. Report it, and say how to recover.
      console.error(`[comp-membership] email to ${req.email} failed`, err);
      out.ok = false;
      out.notification.error = `${err instanceof Error ? err.message : String(err)} — the grant is saved; re-run with force:true to retry the email.`;
    }
  }

  if (!deps.inviteToUpcomingSessions) {
    out.invites.skipped = "Zoom is not configured";
  } else {
    try {
      const sweep = await deps.inviteToUpcomingSessions(req.email);
      out.invites = { ran: true, ok: sweep.ok };
    } catch (err) {
      // Best-effort: the daily class-member-invites cron is the safety net.
      console.error(`[comp-membership] invites for ${req.email} failed (daily cron will retry)`, err);
      out.invites = { ran: true, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return out;
}
