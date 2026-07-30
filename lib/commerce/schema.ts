// ── Commerce core — schema bootstrap ────────────────────────────────────────
// Idempotent CREATE TABLE IF NOT EXISTS, matching the lib/db.ts lazy-init
// pattern already used for `signups`. One Postgres (Neon), multi-brand via a
// `brand` column (only "acp" exists for now — Agile Lens rides the same
// tables in Phase 3).

import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;
let _ensured = false;

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_sql) _sql = neon(url);
  return _sql;
}

export async function ensureCommerceSchema() {
  if (_ensured) return;
  const db = sql();

  await db`
    CREATE TABLE IF NOT EXISTS customers (
      id                BIGSERIAL PRIMARY KEY,
      brand             TEXT NOT NULL DEFAULT 'acp',
      email             TEXT NOT NULL,
      name              TEXT,
      stripe_customer_id TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (brand, email)
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id                 BIGSERIAL PRIMARY KEY,
      brand              TEXT NOT NULL DEFAULT 'acp',
      customer_id        BIGINT NOT NULL REFERENCES customers(id),
      sku                TEXT NOT NULL,
      stripe_session_id  TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      stripe_event_id    TEXT UNIQUE,
      amount_cents       INTEGER,
      status             TEXT NOT NULL DEFAULT 'paid',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS entitlements (
      id             BIGSERIAL PRIMARY KEY,
      customer_id    BIGINT NOT NULL REFERENCES customers(id),
      sku            TEXT NOT NULL,
      tier           TEXT NOT NULL DEFAULT 'indie',
      status         TEXT NOT NULL DEFAULT 'active', -- active | revoked | redeemed (booking credits)
      source_order_id BIGINT REFERENCES orders(id),
      major_version  INTEGER NOT NULL DEFAULT 1,
      updates_until  TIMESTAMPTZ,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at     TIMESTAMPTZ -- also stamps consumed-at for redeemed credits
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS license_keys (
      id             BIGSERIAL PRIMARY KEY,
      entitlement_id BIGINT NOT NULL REFERENCES entitlements(id),
      key_text       TEXT NOT NULL, -- base64 signed payload, what the buyer receives
      revoked        BOOLEAN NOT NULL DEFAULT false,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS magic_links (
      id          BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id),
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      used_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      id          BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id),
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  _ensured = true;
}
