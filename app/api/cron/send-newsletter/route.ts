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

  // Test-send mode: ?test=<email>&slug=<issue> mails ONE address a [TEST]
  // copy using production's keys — so the Studio can offer test sends even
  // when the laptop has no local RESEND_API_KEY. Tracking stays ON, under
  // an isolated "test-<slug>" campaign, so the whole pixel/click pipeline
  // can be exercised end-to-end without touching real campaign stats.
  const testTo = req.nextUrl.searchParams.get("test");
  if (testTo) {
    const slug = req.nextUrl.searchParams.get("slug");
    const issue = slug ? getNewsletterIssues().find((i) => i.slug === slug) : getNewsletterIssues()[0];
    if (!issue) return NextResponse.json({ error: "No such issue" }, { status: 404 });
    if (!testTo.includes("@")) return NextResponse.json({ error: "Bad test address" }, { status: 400 });
    const result = await sendCampaign({
      campaign: `test-${issue.slug}`,
      subject: issue.subject || issue.title,
      bodyMarkdown: issue.body,
      list: "newsletter",
      reason: LIST_REASON.newsletter,
      broad: true,
      siteUrl: site,
      webUrl: `${site}/newsletter/${issue.slug}`,
      preheader: issue.preheader || undefined,
      testTo: [testTo],
      testTracking: true,
    });
    return NextResponse.json({ test: testTo, slug: issue.slug, ...result });
  }

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
        preheader: issue.preheader || undefined,
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
