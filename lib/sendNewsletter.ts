// ── Campaign send core ──────────────────────────────────────────────────────
// The ONE implementation of "turn an issue into per-recipient emails and
// send them" — scripts/broadcast.mjs (CLI) and scripts/newsletter-studio.mjs
// (UI) both call this, so footer language, unsubscribe links, tracking, and
// batching behave identically no matter how a send is triggered.
//
// Per recipient, every email gets:
//   - the attribution footer: "You're receiving this newsletter because
//     <reason>. [tailoring note] To unsubscribe from this list, click here."
//   - a one-click unsubscribe link (deterministic HMAC token — see
//     lib/unsubscribe.ts) carrying &c=<campaign> so unsubs attribute to the
//     send that caused them
//   - List-Unsubscribe headers (Gmail/Outlook native one-click button)
//   - when tracking is on: an open pixel + click-wrapped links (lib/tracking)

import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
// .ts extensions so Node can run this directly (Studio/CLI) without a
// bundler — Next's compiler accepts them via allowImportingTsExtensions.
import { renderNewsletterEmail } from "./newsletterEmail.ts";
import { trackOpenUrl, trackClickUrl, recordSendEvents } from "./tracking.ts";

const DEFAULT_SITE = "https://alexcoulombepresents.com";

function unsubscribeUrl(email: string, site: string, campaign?: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const token = crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
  const c = campaign ? `&c=${encodeURIComponent(campaign)}` : "";
  return `${site}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}${c}`;
}

// Wrap every real link for click tracking — except unsubscribe (must stay
// one-click direct; wrapping it also inflates click stats) and mailto.
function wrapLinks(html: string, siteUrl: string, campaign: string, email: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    if (url.includes("/api/unsubscribe") || url.includes("/api/t/")) return match;
    return `href="${trackClickUrl(siteUrl, campaign, email, url)}"`;
  });
}

export type ComposedEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

export function composeEmail(opts: {
  to: string;
  subject: string;
  bodyMarkdown: string;
  reason: string;
  broad?: boolean;
  campaign: string;
  tracking?: boolean;
  siteUrl?: string;
  /** Public archive URL — adds a "View this issue in your browser" link. */
  webUrl?: string;
}): ComposedEmail {
  const site = opts.siteUrl ?? DEFAULT_SITE;
  const tailoring = opts.broad
    ? " Future newsletters will be more tailored to the specific list you signed up for."
    : "";
  const unsubUrl = unsubscribeUrl(opts.to, site, opts.campaign);
  const webLinkHtml = opts.webUrl
    ? `<a href="${opts.webUrl}" style="color:#888">View this issue in your browser.</a> `
    : "";
  const webLinkText = opts.webUrl ? `View this issue in your browser: ${opts.webUrl}\n` : "";
  const footerHtml = `${webLinkHtml}You&rsquo;re receiving this newsletter because ${opts.reason}.${tailoring} <a href="${unsubUrl}" style="color:#888">To unsubscribe from this list, click here.</a>`;
  const footerText = `${webLinkText}You're receiving this newsletter because ${opts.reason}.${tailoring} To unsubscribe from this list, click here: ${unsubUrl}`;

  let html = renderNewsletterEmail({ bodyMarkdown: opts.bodyMarkdown, footerHtml, siteUrl: site });
  if (opts.tracking !== false) {
    html = wrapLinks(html, site, opts.campaign, opts.to);
    html = html.replace(
      "</body>",
      `<img src="${trackOpenUrl(site, opts.campaign, opts.to)}" width="1" height="1" style="display:none" alt="" /></body>`
    );
  }

  return {
    to: opts.to,
    subject: opts.subject,
    html,
    text: `${opts.bodyMarkdown}\n\n---\n${footerText}`,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/**
 * Deduped union of one or more lists — a person on several selected lists
 * gets exactly one email. Accepts a single slug for convenience.
 */
export async function listRecipients(lists: string | string[]): Promise<string[]> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const slugs = Array.isArray(lists) ? lists : [lists];
  if (slugs.length === 0) return [];
  const sql = neon(url);
  // One retry after a short pause — a transient connect timeout must not
  // surface as a scary failure in the middle of a send flow.
  const query = async () =>
    (await sql`SELECT DISTINCT lower(email) AS email FROM signups WHERE list = ANY(${slugs}) ORDER BY email`) as { email: string }[];
  let rows: { email: string }[];
  try {
    rows = await query();
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
    rows = await query();
  }
  return rows.map((r) => r.email);
}

export type SendResult = { sent: number; recipients: number; errors: string[] };

// ── Scheduled-send claims ───────────────────────────────────────────────────
// Same idempotency pattern as order fulfillment: a UNIQUE-keyed claim row is
// taken BEFORE sending, so overlapping cron fires (or a cron retry) can never
// double-send a campaign. completed_at records the outcome afterwards.

async function ensureSendsTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_sends (
      campaign     TEXT PRIMARY KEY,
      lists        TEXT NOT NULL,
      claimed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at TIMESTAMPTZ,
      sent         INTEGER,
      recipients   INTEGER,
      errors       TEXT
    )
  `;
}

/** True only for the FIRST caller — everyone else must not send. */
export async function claimCampaignSend(campaign: string, lists: string[]): Promise<boolean> {
  await ensureSendsTable();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`
    INSERT INTO campaign_sends (campaign, lists)
    VALUES (${campaign}, ${lists.join(",")})
    ON CONFLICT (campaign) DO NOTHING
    RETURNING campaign
  `) as { campaign: string }[];
  return rows.length > 0;
}

export async function completeCampaignSend(campaign: string, result: SendResult): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE campaign_sends
    SET completed_at = now(), sent = ${result.sent}, recipients = ${result.recipients},
        errors = ${result.errors.join("; ") || null}
    WHERE campaign = ${campaign}
  `;
}

export type CampaignSendRow = {
  campaign: string;
  lists: string;
  claimed_at: string;
  completed_at: string | null;
  sent: number | null;
  recipients: number | null;
  errors: string | null;
};

export async function getCampaignSends(): Promise<CampaignSendRow[]> {
  await ensureSendsTable();
  const sql = neon(process.env.DATABASE_URL!);
  return (await sql`SELECT * FROM campaign_sends ORDER BY claimed_at DESC`) as CampaignSendRow[];
}

/**
 * Send a campaign to one or more lists (deduped union) — or, with testTo
 * set, ONLY to those addresses (subject gets a [TEST] prefix, no events
 * recorded, tracking off). The caller is responsible for having confirmed
 * the send with a human (or a human-approved schedule).
 */
export async function sendCampaign(opts: {
  campaign: string;
  subject: string;
  bodyMarkdown: string;
  list: string | string[];
  reason: string;
  broad?: boolean;
  siteUrl?: string;
  /** Public archive URL for the "view in browser" footer link. */
  webUrl?: string;
  testTo?: string[];
  onProgress?: (sent: number, total: number) => void;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(key);
  const from = "Alex Coulombe Presents <noreply@alexcoulombepresents.com>";

  const isTest = !!opts.testTo?.length;
  const emails = isTest ? opts.testTo! : await listRecipients(opts.list);
  const errors: string[] = [];
  let sent = 0;

  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const batch = chunk.map((to) => {
      const e = composeEmail({
        to,
        subject: isTest ? `[TEST] ${opts.subject}` : opts.subject,
        bodyMarkdown: opts.bodyMarkdown,
        reason: opts.reason,
        broad: opts.broad,
        campaign: opts.campaign,
        tracking: !isTest,
        siteUrl: opts.siteUrl,
        webUrl: opts.webUrl,
      });
      return { from, to: e.to, subject: e.subject, html: e.html, text: e.text, headers: e.headers };
    });
    const { error } = await resend.batch.send(batch);
    if (error) {
      errors.push(`batch ${i / 100 + 1}: ${error.message ?? JSON.stringify(error)}`);
    } else {
      sent += chunk.length;
      if (!isTest) {
        try {
          await recordSendEvents(opts.campaign, chunk);
        } catch (err) {
          console.error("[send] event log failed (send itself succeeded):", err);
        }
      }
      opts.onProgress?.(sent, emails.length);
    }
  }

  return { sent, recipients: emails.length, errors };
}
