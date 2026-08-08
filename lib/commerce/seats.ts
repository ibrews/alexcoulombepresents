// ── Seat scarcity — real order tracking for capacity-limited store items ───
//
// NOTE ON NAMING: lib/commerce/schema.ts already owns a table named `orders`
// (customer/entitlement/license-key flow for the digital-download catalog).
// This is a separate, simpler ledger for the manual-fulfillment catalog
// (lib/store.ts) plus donations/digital, purely so seat counts (and the
// admin roster) are backed by real Stripe events instead of vibes. Table is
// named `catalog_orders` to stay distinct from that one. Same lazy-neon-
// singleton + idempotent CREATE TABLE IF NOT EXISTS pattern as lib/db.ts.

import { neon } from "@neondatabase/serverless";
import type { StoreItem } from "@/lib/store";

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
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS catalog_orders (
      id                    BIGSERIAL PRIMARY KEY,
      stripe_session_id     TEXT UNIQUE NOT NULL,
      payment_intent_id     TEXT,
      slug                  TEXT,
      email                 TEXT,
      name                  TEXT,
      amount_cents          INTEGER,
      refunded              BOOLEAN NOT NULL DEFAULT false,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Free-text answer from a required Stripe Checkout custom_field (e.g. "which
  // Friday would you like?" on office-hours bookings) — captures a structured
  // detail the buyer supplied at checkout instead of relying on a reply-email
  // round-trip. Null for every item that doesn't ask a custom field.
  await db`ALTER TABLE catalog_orders ADD COLUMN IF NOT EXISTS note TEXT`;
  await db`CREATE INDEX IF NOT EXISTS catalog_orders_slug_idx ON catalog_orders (slug)`;
  await db`CREATE INDEX IF NOT EXISTS catalog_orders_pi_idx ON catalog_orders (payment_intent_id)`;
  _ensured = true;
}

export type CatalogOrderRow = {
  id: number;
  stripe_session_id: string;
  payment_intent_id: string | null;
  slug: string | null;
  email: string | null;
  name: string | null;
  amount_cents: number | null;
  note: string | null;
  refunded: boolean;
  created_at: string;
};

// Idempotent insert keyed on stripe_session_id — safe to call on every
// checkout.session.completed webhook delivery/retry. Never throws past the
// caller unless the caller wants it to (webhook wraps this in try/catch so a
// DB hiccup can never break existing email fulfillment).
export async function recordCatalogOrder(input: {
  stripeSessionId: string;
  paymentIntentId?: string | null;
  slug?: string | null;
  email?: string | null;
  name?: string | null;
  amountCents?: number | null;
  note?: string | null;
}): Promise<void> {
  await ensureTable();
  await sql()`
    INSERT INTO catalog_orders (stripe_session_id, payment_intent_id, slug, email, name, amount_cents, note)
    VALUES (${input.stripeSessionId}, ${input.paymentIntentId ?? null}, ${input.slug ?? null}, ${input.email ?? null}, ${input.name ?? null}, ${input.amountCents ?? null}, ${input.note ?? null})
    ON CONFLICT (stripe_session_id) DO NOTHING
  `;
}

// Marks every order tied to a payment_intent as refunded (charge.refunded).
export async function markCatalogOrdersRefunded(paymentIntentId: string): Promise<number> {
  await ensureTable();
  const rows = (await sql()`
    UPDATE catalog_orders SET refunded = true
    WHERE payment_intent_id = ${paymentIntentId} AND refunded = false
    RETURNING id
  `) as { id: number }[];
  return rows.length;
}

// Non-refunded seats sold for a given catalog slug.
export async function getSeatsSold(slug: string): Promise<number> {
  await ensureTable();
  const rows = (await sql()`
    SELECT COUNT(*)::int AS count FROM catalog_orders WHERE slug = ${slug} AND refunded = false
  `) as { count: number }[];
  return rows[0]?.count ?? 0;
}

// Remaining seats for a capacity-limited item, or null if it has no cap.
export async function getRemaining(item: StoreItem): Promise<number | null> {
  if (item.capacity === undefined) return null;
  const sold = await getSeatsSold(item.slug);
  return Math.max(0, item.capacity - sold);
}

// Every non-refunded order for one slug — used by the class-cancellation
// flow (app/api/telegram/webhook.ts's class-no handling) to email every
// buyer of a session that missed its minEnrollment.
export async function getOrdersForSlug(slug: string): Promise<CatalogOrderRow[]> {
  await ensureTable();
  const rows = (await sql()`
    SELECT * FROM catalog_orders WHERE slug = ${slug} AND refunded = false ORDER BY created_at ASC
  `) as CatalogOrderRow[];
  return rows;
}

// All orders, newest first — for the admin roster export.
export async function getAllCatalogOrders(): Promise<CatalogOrderRow[]> {
  await ensureTable();
  const rows = (await sql()`
    SELECT * FROM catalog_orders ORDER BY created_at DESC
  `) as CatalogOrderRow[];
  return rows;
}
