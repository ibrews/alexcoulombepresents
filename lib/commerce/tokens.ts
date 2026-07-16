// ── Commerce core — magic-link + session tokens ─────────────────────────────
// Passwordless auth, thin and dependency-free (matches the stripe-webhook
// HMAC pattern already in this repo — no NextAuth/Auth.js dependency for
// Phase 1). A token is a random 32-byte value; only its SHA-256 hash is
// stored, so a leaked DB row can't be replayed as a live token.
//
// Required env: AUTH_SECRET (any long random string — used to salt hashes).

import crypto from "node:crypto";
import { sql, ensureCommerceSchema } from "./schema";

function hash(token: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function issueMagicLink(customerId: number): Promise<string> {
  await ensureCommerceSchema();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await sql()`
    INSERT INTO magic_links (customer_id, token_hash, expires_at)
    VALUES (${customerId}, ${hash(token)}, ${expiresAt.toISOString()})
  `;
  return token;
}

// Consumes the magic link (single use) and returns a fresh 30-day session
// token, or null if the link is invalid/expired/already used.
export async function redeemMagicLink(token: string): Promise<string | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    UPDATE magic_links
    SET used_at = now()
    WHERE token_hash = ${hash(token)}
      AND used_at IS NULL
      AND expires_at > now()
    RETURNING customer_id
  `) as { customer_id: number }[];
  const customerId = rows[0]?.customer_id;
  if (!customerId) return null;

  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await sql()`
    INSERT INTO sessions (customer_id, token_hash, expires_at)
    VALUES (${customerId}, ${hash(sessionToken)}, ${expiresAt.toISOString()})
  `;
  return sessionToken;
}

// Logout: kill the session row so a stolen/stale cookie can't be replayed.
export async function destroySession(sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) return;
  await ensureCommerceSchema();
  await sql()`DELETE FROM sessions WHERE token_hash = ${hash(sessionToken)}`;
}

export async function customerFromSession(sessionToken: string | undefined): Promise<number | null> {
  if (!sessionToken) return null;
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT customer_id FROM sessions
    WHERE token_hash = ${hash(sessionToken)} AND expires_at > now()
  `) as { customer_id: number }[];
  return rows[0]?.customer_id ?? null;
}
