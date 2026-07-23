// ── Email open/click tracking ───────────────────────────────────────────────
// Campaign-level engagement stats, self-hosted: an invisible pixel per email
// (opens) and a signed redirect wrapping each link (clicks), both landing in
// one Neon table. Every URL is HMAC-signed with AUTH_SECRET so nobody can
// stuff junk events or use /api/t/c as an open redirect — an unsigned or
// tampered request records nothing and bounces to the homepage.
//
// Deliberately campaign-level in spirit: the dashboard reports aggregates
// (open rate, click rate, top links), not per-person browsing profiles.

import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;
let _ensured = false;

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_sql) _sql = neon(url);
  return _sql;
}

async function ensureTable() {
  if (_ensured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS email_events (
      id         BIGSERIAL PRIMARY KEY,
      campaign   TEXT NOT NULL,
      email      TEXT NOT NULL,
      type       TEXT NOT NULL, -- send | open | click | unsub
      url        TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql()`CREATE INDEX IF NOT EXISTS email_events_campaign_idx ON email_events (campaign, type)`;
  _ensured = true;
}

function hmac(...parts: string[]): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(parts.join("|")).digest("hex").slice(0, 20);
}

export function trackOpenUrl(siteUrl: string, campaign: string, email: string): string {
  const s = hmac("open", campaign, email);
  return `${siteUrl}/api/t/o?c=${encodeURIComponent(campaign)}&e=${encodeURIComponent(email)}&s=${s}`;
}

export function verifyOpenSig(campaign: string, email: string, s: string): boolean {
  try {
    const expected = Buffer.from(hmac("open", campaign, email));
    const given = Buffer.from(s);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

export function trackClickUrl(siteUrl: string, campaign: string, email: string, url: string): string {
  const s = hmac("click", campaign, email, url);
  return `${siteUrl}/api/t/c?c=${encodeURIComponent(campaign)}&e=${encodeURIComponent(email)}&u=${encodeURIComponent(url)}&s=${s}`;
}

export function verifyClickSig(campaign: string, email: string, url: string, s: string): boolean {
  try {
    const expected = Buffer.from(hmac("click", campaign, email, url));
    const given = Buffer.from(s);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

/** Best-effort single event — tracking must never break the user-facing flow. */
export async function recordEmailEvent(ev: {
  campaign: string;
  email: string;
  type: "send" | "open" | "click" | "unsub";
  url?: string;
}): Promise<void> {
  try {
    await ensureTable();
    await sql()`
      INSERT INTO email_events (campaign, email, type, url)
      VALUES (${ev.campaign}, ${ev.email.toLowerCase()}, ${ev.type}, ${ev.url ?? null})
    `;
  } catch (err) {
    console.error("[tracking] event write failed:", err);
  }
}

/** Bulk 'send' rows at campaign send time — one round-trip per batch. */
export async function recordSendEvents(campaign: string, emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  await ensureTable();
  const lowered = emails.map((e) => e.toLowerCase());
  await sql()`
    INSERT INTO email_events (campaign, email, type)
    SELECT ${campaign}, e, 'send' FROM unnest(${lowered}::text[]) AS e
  `;
}

export type CampaignStats = {
  sends: number;
  uniqueOpens: number;
  opens: number;
  uniqueClicks: number;
  clicks: number;
  unsubs: number;
  topLinks: { url: string; clicks: number }[];
};

export async function campaignStats(campaign: string): Promise<CampaignStats> {
  await ensureTable();
  const rows = (await sql()`
    SELECT type, COUNT(*)::int AS total, COUNT(DISTINCT email)::int AS uniq
    FROM email_events WHERE campaign = ${campaign} GROUP BY type
  `) as { type: string; total: number; uniq: number }[];
  const by = Object.fromEntries(rows.map((r) => [r.type, r]));
  const links = (await sql()`
    SELECT url, COUNT(*)::int AS clicks
    FROM email_events WHERE campaign = ${campaign} AND type = 'click' AND url IS NOT NULL
    GROUP BY url ORDER BY clicks DESC LIMIT 10
  `) as { url: string; clicks: number }[];
  return {
    sends: by.send?.total ?? 0,
    uniqueOpens: by.open?.uniq ?? 0,
    opens: by.open?.total ?? 0,
    uniqueClicks: by.click?.uniq ?? 0,
    clicks: by.click?.total ?? 0,
    unsubs: by.unsub?.uniq ?? 0,
    topLinks: links,
  };
}

// 1×1 transparent GIF — the classic tracking pixel payload.
export const PIXEL_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
