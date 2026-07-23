import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getNewsletterIssues } from "@/lib/newsletters";
import { LIST_REASON, isListSlug } from "@/lib/lists";
import { sendCampaign, claimCampaignSend, completeCampaignSend } from "@/lib/sendNewsletter";

// Scheduled-send worker. Studio's "Schedule" writes sendAt/sendLists into an
// issue's frontmatter and pushes; once that deploys, this route (fired by
// Vercel cron and/or the GitHub Actions pinger) sends any issue whose time
// has come. Sending happens HERE, in production, where DATABASE_URL /
// RESEND_API_KEY / AUTH_SECRET already live — the laptop can be closed.
//
// Layered against double-sends and accidents:
//   1. UNIQUE claim row (campaign_sends) taken BEFORE sending — overlapping
//      cron fires can't both send (same pattern as order fulfillment).
//   2. Staleness window: a sendAt more than 48h in the past is skipped and
//      reported, never silently mass-mailed (e.g. a schedule that only got
//      deployed a week late).
//   3. The schedule itself required a typed-count human confirmation in the
//      Studio before it could be written.
//
// Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` when the
// CRON_SECRET env var is set; the GitHub Actions pinger sends the same.

export const maxDuration = 300;

const STALE_MS = 48 * 60 * 60 * 1000;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const now = Date.now();
  const results: Record<string, unknown>[] = [];

  for (const issue of getNewsletterIssues()) {
    if (!issue.sendAt || issue.sentAt) continue;
    const due = Date.parse(issue.sendAt);
    if (Number.isNaN(due) || due > now) continue;

    if (now - due > STALE_MS) {
      results.push({ campaign: issue.slug, skipped: `sendAt is ${Math.round((now - due) / 3600000)}h old — stale, not sending` });
      continue;
    }

    const lists = issue.sendLists.split(",").map((s) => s.trim()).filter(isListSlug);
    if (lists.length === 0) {
      results.push({ campaign: issue.slug, skipped: "no valid lists in sendLists" });
      continue;
    }

    const claimed = await claimCampaignSend(issue.slug, lists);
    if (!claimed) {
      results.push({ campaign: issue.slug, skipped: "already claimed/sent" });
      continue;
    }

    const reason = lists.length === 1 ? LIST_REASON[lists[0]] : LIST_REASON.newsletter;
    try {
      const result = await sendCampaign({
        campaign: issue.slug,
        subject: issue.subject || issue.title,
        bodyMarkdown: issue.body,
        list: lists,
        reason,
        broad: issue.sendBroad === "1",
        siteUrl: site,
        webUrl: `${site}/newsletter/${issue.slug}`,
      });
      await completeCampaignSend(issue.slug, result);
      results.push({ campaign: issue.slug, sent: result.sent, recipients: result.recipients, errors: result.errors });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await completeCampaignSend(issue.slug, { sent: 0, recipients: 0, errors: [message] });
      results.push({ campaign: issue.slug, error: message });
    }
  }

  return NextResponse.json({ checked: new Date(now).toISOString(), results });
}
