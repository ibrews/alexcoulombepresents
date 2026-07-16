// ── Self-serve unsubscribe ───────────────────────────────────────────────────
// One-click, no login required. The token is a deterministic HMAC of the
// email (not a stored one-time token like magic links) — a link mailed out
// today must still work if someone clicks it a year from now. Verifying just
// means recomputing the HMAC, so there's nothing to expire or store.
//
// Required env: AUTH_SECRET (already used for magic links / sessions).

import crypto from "node:crypto";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

export function unsubscribeToken(email: string): string {
  return crypto.createHmac("sha256", secret()).update(email.toLowerCase().trim()).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// The exact link every broadcast/newsletter email should include in its footer.
export function unsubscribeUrl(email: string, site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com"): string {
  const token = unsubscribeToken(email);
  return `${site}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
