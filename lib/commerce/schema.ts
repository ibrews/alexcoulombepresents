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

  // Partial (not table-wide) unique index: at most one `membership` row per
  // customer. Booking credits legitimately have many rows per customer per
  // sku, so this can't be a blanket (customer_id, sku) constraint — it only
  // constrains sku='membership', matching the ON CONFLICT target in
  // grantOrExtendMembership. Without this, two webhook events for the same
  // signup (e.g. customer.subscription.updated + invoice.paid, which Stripe
  // fires within milliseconds of each other) can both race past a
  // check-then-insert and create duplicate membership rows.
  await db`
    CREATE UNIQUE INDEX IF NOT EXISTS entitlements_one_membership_per_customer
      ON entitlements (customer_id)
      WHERE sku = 'membership'
  `;

  // Marks the moment a membership row's welcome email was claimed for sending
  // (lib/commerce/membership.ts's claimMembershipWelcome). It exists because
  // "is this a brand-new member?" CANNOT be inferred from whether the grant
  // INSERTed vs UPDATEd: the unique index above deliberately turns whichever
  // of customer.subscription.updated / invoice.paid arrives second into an
  // UPDATE, and Stripe guarantees no ordering between them. Keying the
  // welcome off a dedicated, atomically-claimed column makes it fire exactly
  // once per member no matter which event wins the race.
  await db`ALTER TABLE entitlements ADD COLUMN IF NOT EXISTS welcomed_at TIMESTAMPTZ`;

  // Partial unique index: at most one tier='member' row per (customer_id,
  // sku) — mirrors entitlements_one_membership_per_customer above, but
  // scoped to member-perk product licenses (e.g. xrsim, see
  // lib/commerce/memberLicensing.ts) instead of the membership sku itself. A
  // customer can still separately hold a purchased (tier != 'member') row
  // for the same sku — this only constrains the auto-issued member-perk row,
  // so the daily refresh cron's ON CONFLICT target is a real upsert instead
  // of a check-then-insert race.
  await db`
    CREATE UNIQUE INDEX IF NOT EXISTS entitlements_one_member_license_per_customer_sku
      ON entitlements (customer_id, sku)
      WHERE tier = 'member'
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

  // ── /book — request-then-confirm-then-pay appointments ───────────────────
  // status: requested → confirmed → paid, or declined/expired/cancelled.
  // Payment happens only after a confirmation, so a row can sit unpaid
  // indefinitely; hold_expires_at is what stops a confirmed-but-unpaid slot
  // from being blocked forever.
  await db`
    CREATE TABLE IF NOT EXISTS bookings (
      id              BIGSERIAL PRIMARY KEY,
      brand           TEXT NOT NULL DEFAULT 'acp',
      token           TEXT NOT NULL UNIQUE,
      slot_start      TIMESTAMPTZ NOT NULL,
      slot_end        TIMESTAMPTZ NOT NULL,
      name            TEXT NOT NULL,
      email           TEXT NOT NULL,
      note            TEXT,
      status          TEXT NOT NULL DEFAULT 'requested',
      price_cents     INTEGER NOT NULL,
      hold_expires_at TIMESTAMPTZ,
      stripe_session_id TEXT,
      confirmed_at    TIMESTAMPTZ,
      declined_at     TIMESTAMPTZ,
      paid_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // The real double-booking guard. Two people can hit "request" on the same
  // time in the same second; a check-then-insert loses that race, so the
  // constraint lives in the database and the insert is allowed to fail.
  //
  // This is an OVERLAP exclusion, not a unique index on slot_start. Once
  // bookings can be 1, 2, or 3 hours long, "same start time" stops being the
  // same question as "conflicts": a 3-hour booking at 13:00 and a 1-hour
  // booking at 14:00 have different starts and collide completely. A unique
  // index would have waved that straight through.
  //
  // Partial, so declined/expired/cancelled rows free their time back up.
  await db`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap') THEN
        ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
          EXCLUDE USING gist (tstzrange(slot_start, slot_end) WITH &&)
          WHERE (status IN ('requested', 'confirmed', 'paid'));
      END IF;
    END $$;
  `;
  // Superseded by the exclusion constraint above — it only ever caught the
  // identical-start case.
  await db`DROP INDEX IF EXISTS bookings_one_live_per_slot`;

  _ensured = true;
}
