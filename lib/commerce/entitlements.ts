// ── Commerce core — entitlement fulfillment + refund revoke ────────────────

import { sql, ensureCommerceSchema } from "./schema";
import { issueLicenseKey } from "./license";
import { findDigitalProduct } from "./products";
import { MEMBERSHIP_SKU } from "./membership";
import type { MemberLicenseTarget } from "./memberLicensing";

export async function findOrCreateCustomer(email: string, name?: string | null): Promise<number> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    INSERT INTO customers (brand, email, name)
    VALUES ('acp', ${email}, ${name ?? null})
    ON CONFLICT (brand, email) DO UPDATE SET name = COALESCE(EXCLUDED.name, customers.name)
    RETURNING id
  `) as { id: number }[];
  return rows[0].id;
}

export type CustomerRow = {
  id: number;
  email: string;
  name: string | null;
  stripe_customer_id: string | null;
};

export async function getCustomer(customerId: number): Promise<CustomerRow | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id, email, name, stripe_customer_id FROM customers WHERE id = ${customerId}
  `) as CustomerRow[];
  return rows[0] ?? null;
}

export async function customerByEmail(email: string): Promise<CustomerRow | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id, email, name, stripe_customer_id FROM customers
    WHERE brand = 'acp' AND email = ${email}
  `) as CustomerRow[];
  return rows[0] ?? null;
}

// Stores the Stripe customer id the first time a subscription event tells us
// about it — the key /account needs to open the Stripe Customer Portal.
export async function setStripeCustomerId(customerId: number, stripeCustomerId: string): Promise<void> {
  await ensureCommerceSchema();
  await sql()`
    UPDATE customers SET stripe_customer_id = ${stripeCustomerId}
    WHERE id = ${customerId} AND stripe_customer_id IS DISTINCT FROM ${stripeCustomerId}
  `;
}

export async function customerIdForStripeCustomer(stripeCustomerId: string): Promise<number | null> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id FROM customers WHERE stripe_customer_id = ${stripeCustomerId} AND brand = 'acp'
  `) as { id: number }[];
  return rows[0]?.id ?? null;
}

// Idempotent: returns the existing order if this Stripe event was already
// processed (dedupe key = stripe_event_id), otherwise fulfills fresh.
export async function fulfillDigitalPurchase(input: {
  stripeEventId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  sku: string;
  email: string;
  name?: string | null;
  amountCents: number;
}): Promise<{ alreadyProcessed: boolean; licenseKey?: string; customerId?: number }> {
  await ensureCommerceSchema();
  const db = sql();

  const existing = (await db`
    SELECT id FROM orders WHERE stripe_event_id = ${input.stripeEventId}
  `) as { id: number }[];
  if (existing.length > 0) return { alreadyProcessed: true };

  const product = findDigitalProduct(input.sku);
  if (!product) throw new Error(`Unknown digital SKU: ${input.sku}`);

  const customerId = await findOrCreateCustomer(input.email, input.name);

  const orderRows = (await db`
    INSERT INTO orders (brand, customer_id, sku, stripe_session_id, stripe_payment_intent_id, stripe_event_id, amount_cents, status)
    VALUES ('acp', ${customerId}, ${input.sku}, ${input.stripeSessionId}, ${input.stripePaymentIntentId ?? null}, ${input.stripeEventId}, ${input.amountCents}, 'paid')
    ON CONFLICT (stripe_session_id) DO NOTHING
    RETURNING id
  `) as { id: number }[];
  // If the session was already recorded under a different event id (e.g. a
  // dashboard resend), treat as already processed rather than double-issuing.
  if (orderRows.length === 0) return { alreadyProcessed: true };
  const orderId = orderRows[0].id;

  const updatesUntil = new Date(Date.now() + product.updatesWindowDays * 24 * 60 * 60 * 1000);

  const entRows = (await db`
    INSERT INTO entitlements (customer_id, sku, tier, status, source_order_id, major_version, updates_until)
    VALUES (${customerId}, ${product.sku}, ${product.tier}, 'active', ${orderId}, ${product.majorVersion}, ${updatesUntil.toISOString()})
    RETURNING id
  `) as { id: number }[];
  const entitlementId = entRows[0].id;

  const licenseKey = issueLicenseKey({
    sku: product.sku,
    tier: product.tier,
    seats: 1,
    licensee_email: input.email,
    major_version: product.majorVersion,
    updates_until: updatesUntil.toISOString(),
    issued_at: new Date().toISOString(),
  });

  await db`
    INSERT INTO license_keys (entitlement_id, key_text)
    VALUES (${entitlementId}, ${licenseKey})
  `;

  return { alreadyProcessed: false, licenseKey, customerId };
}

// Idempotency for NON-digital fulfillment (vouchers, manual-catalog orders),
// mirroring the dedupe keys used by fulfillDigitalPurchase. Two halves so the
// webhook can order things safely: check BEFORE doing work, record only AFTER
// the work succeeded. A retry after a mid-flight failure therefore re-runs
// the (idempotent) work instead of skipping it forever.
export async function checkoutSessionProcessed(
  stripeEventId: string,
  stripeSessionId: string
): Promise<boolean> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id FROM orders
    WHERE stripe_event_id = ${stripeEventId} OR stripe_session_id = ${stripeSessionId}
    LIMIT 1
  `) as { id: number }[];
  return rows.length > 0;
}

export async function recordCheckoutSession(input: {
  stripeEventId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  sku: string;
  email: string;
  name?: string | null;
  amountCents: number;
}): Promise<void> {
  await ensureCommerceSchema();
  const customerId = await findOrCreateCustomer(input.email, input.name);
  await sql()`
    INSERT INTO orders (brand, customer_id, sku, stripe_session_id, stripe_payment_intent_id, stripe_event_id, amount_cents, status)
    VALUES ('acp', ${customerId}, ${input.sku}, ${input.stripeSessionId}, ${input.stripePaymentIntentId ?? null}, ${input.stripeEventId}, ${input.amountCents}, 'paid')
    ON CONFLICT (stripe_session_id) DO NOTHING
  `;
}

// Revokes every entitlement tied to a Stripe checkout session (refund path).
// Download tokens are presigned on-demand, so revocation alone kills future
// downloads; already-downloaded offline copies are out of scope per the
// business plan's stated posture.
export async function revokeEntitlementsForPaymentIntent(paymentIntentId: string): Promise<number> {
  await ensureCommerceSchema();
  const db = sql();
  const orderRows = (await db`SELECT id FROM orders WHERE stripe_payment_intent_id = ${paymentIntentId}`) as { id: number }[];
  if (orderRows.length === 0) return 0;
  const orderId = orderRows[0].id;

  const entRows = (await db`
    UPDATE entitlements SET status = 'revoked', revoked_at = now()
    WHERE source_order_id = ${orderId} AND status = 'active'
    RETURNING id
  `) as { id: number }[];

  for (const { id } of entRows) {
    await db`UPDATE license_keys SET revoked = true WHERE entitlement_id = ${id}`;
  }
  await db`UPDATE orders SET status = 'refunded' WHERE id = ${orderId}`;
  return entRows.length;
}

export type EntitlementRow = {
  id: number;
  sku: string;
  tier: string;
  status: string;
  major_version: number;
  updates_until: string | null;
  created_at: string;
  key_text: string | null;
};

export async function entitlementsForCustomer(customerId: number): Promise<EntitlementRow[]> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT e.id, e.sku, e.tier, e.status, e.major_version, e.updates_until, e.created_at,
           lk.key_text
    FROM entitlements e
    LEFT JOIN license_keys lk ON lk.entitlement_id = e.id AND lk.revoked = false
    WHERE e.customer_id = ${customerId}
    ORDER BY e.created_at DESC
  `) as EntitlementRow[];
  return rows;
}

// ── Member-perk product licensing (real DB side of lib/commerce/memberLicensing.ts) ─

// Every customer with a currently-active membership entitlement — the
// candidate list for a member-perk product license refresh (e.g. xrsim).
export async function activeMembersForLicensing(): Promise<MemberLicenseTarget[]> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT c.id AS customer_id, c.email
    FROM entitlements e
    JOIN customers c ON c.id = e.customer_id
    WHERE e.sku = ${MEMBERSHIP_SKU}
      AND e.status = 'active'
      AND (e.updates_until IS NULL OR e.updates_until > now())
  `) as { customer_id: number; email: string }[];
  return rows.map((r) => ({ customerId: r.customer_id, email: r.email }));
}

// Upserts the (customer, sku) member-tier entitlement to `updatesUntil` and
// stores a freshly-signed key as this customer's current one — any prior
// member-tier key for this entitlement is revoked first, so /account's
// key_text join (entitlementsForCustomer above) never returns more than one
// live key per entitlement. Relies on
// entitlements_one_member_license_per_customer_sku (schema.ts) — at most one
// tier='member' row per (customer_id, sku) — so this is a real upsert, not a
// check-then-insert (safe against a cron retry or a second concurrent run
// landing on the same customer).
export async function grantOrRefreshMemberLicense(
  customerId: number,
  email: string,
  sku: string,
  majorVersion: number,
  updatesUntil: Date
): Promise<void> {
  await ensureCommerceSchema();
  const db = sql();

  // Sign BEFORE touching the database. issueLicenseKey throws when
  // LICENSE_SIGNING_PRIVATE_KEY is missing or malformed, and when that
  // happened after the entitlement insert it left a member entitlement with
  // no key attached at all — observed live 2026-08-11, a keyless xrsim row
  // for a real member. Signing first makes the failure a clean no-op.
  const licenseKey = issueLicenseKey({
    sku,
    tier: "member",
    seats: 1,
    licensee_email: email,
    major_version: majorVersion,
    updates_until: updatesUntil.toISOString(),
    issued_at: new Date().toISOString(),
  });

  const entRows = (await db`
    INSERT INTO entitlements (customer_id, sku, tier, status, major_version, updates_until)
    VALUES (${customerId}, ${sku}, 'member', 'active', ${majorVersion}, ${updatesUntil.toISOString()})
    ON CONFLICT (customer_id, sku) WHERE tier = 'member'
    DO UPDATE SET
      status = 'active',
      revoked_at = NULL,
      major_version = EXCLUDED.major_version,
      updates_until = EXCLUDED.updates_until
    RETURNING id
  `) as { id: number }[];
  const entitlementId = entRows[0].id;

  // Revoke-then-insert as one transaction: separately, a failure between them
  // leaves the entitlement with every key revoked and no replacement, which
  // reads to the member as "my license vanished". The entitlementsForCustomer
  // join also assumes at most one live key per entitlement, so these two must
  // never be observable half-applied.
  await db.transaction([
    db`UPDATE license_keys SET revoked = true WHERE entitlement_id = ${entitlementId} AND revoked = false`,
    db`INSERT INTO license_keys (entitlement_id, key_text) VALUES (${entitlementId}, ${licenseKey})`,
  ]);
}
