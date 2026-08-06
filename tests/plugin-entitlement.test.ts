// ── Plugin entitlement (HMAC license verification) tests ───────────────────
// Runs on Node's built-in test runner (node --test, type stripping — no test
// framework dependency), same pattern as tests/membership-webhook.test.ts.
// verifyPluginLicense has no runtime imports beyond node:crypto, so these
// tests exercise the exact algorithm the route calls — no database, no
// network, no Next.js server needed.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyPluginLicense, type PluginLicenseFields } from "../lib/commerce/pluginLicensing.ts";

const SECRET = "test-secret-not-real";

// Mirrors computeSignature() in lib/commerce/pluginLicensing.ts — deliberately
// reimplemented here (not imported) so the test proves the route's algorithm
// against an independent implementation of the documented spec, not just
// against itself.
function sign(fields: PluginLicenseFields, secret = SECRET): string {
  const message = [fields.product, fields.licensee, fields.email, fields.tier, fields.seats, fields.expiry].join(
    "|"
  );
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function futureExpiry(days = 365): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

function pastExpiry(days = 1): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const baseFields = (overrides: Partial<PluginLicenseFields> = {}): PluginLicenseFields => ({
  product: "URMBridge",
  licensee: "Acme Studio",
  email: "buyer@example.com",
  tier: "com",
  seats: 1,
  expiry: futureExpiry(),
  ...overrides,
});

// ── Round trip: generate a valid signature, confirm entitled: true ─────────

test("valid signature + unexpired license is entitled", () => {
  const fields = baseFields();
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, true);
  assert.equal(result.entitled && result.product, "URMBridge");
  assert.equal(result.entitled && result.tier, "com");
  assert.equal(result.entitled && result.expiry, fields.expiry);
});

test("every product in the spec round-trips", () => {
  for (const product of ["URMBridge", "SceneAudit", "Forage", "BPAutoLayout", "URKPreviewer"] as const) {
    const fields = baseFields({ product });
    const signature = sign(fields);
    const result = verifyPluginLicense({ ...fields, signature }, SECRET);
    assert.equal(result.entitled, true, `${product} should be entitled`);
  }
});

test("edu tier round-trips the same as com", () => {
  const fields = baseFields({ tier: "edu", seats: 30 });
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, true);
  assert.equal(result.entitled && result.tier, "edu");
});

// ── Tamper one byte → rejected ──────────────────────────────────────────────

test("tampering one byte of a valid signature is rejected", () => {
  const fields = baseFields();
  const signature = sign(fields);
  const lastChar = signature.at(-1);
  const tampered = signature.slice(0, -1) + (lastChar === "0" ? "1" : "0");
  const result = verifyPluginLicense({ ...fields, signature: tampered }, SECRET);
  assert.equal(result.entitled, false);
});

test("signature computed with the wrong secret is rejected", () => {
  const fields = baseFields();
  const signature = sign(fields, "wrong-secret");
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, false);
});

test("tampering a field after signing (licensee swapped) invalidates the signature", () => {
  const fields = baseFields();
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, licensee: "Someone Else", signature }, SECRET);
  assert.equal(result.entitled, false);
});

test("expired license fails even with a genuinely valid signature", () => {
  const fields = baseFields({ expiry: pastExpiry() });
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, false);
});

test("unknown product is rejected", () => {
  const fields = { ...baseFields(), product: "NotARealProduct" } as unknown as PluginLicenseFields;
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, false);
});

test("unknown tier is rejected", () => {
  const fields = { ...baseFields(), tier: "enterprise" } as unknown as PluginLicenseFields;
  const signature = sign(fields);
  const result = verifyPluginLicense({ ...fields, signature }, SECRET);
  assert.equal(result.entitled, false);
});

test("missing fields are rejected without throwing", () => {
  const result = verifyPluginLicense({ product: "URMBridge" }, SECRET);
  assert.equal(result.entitled, false);
});

test("a signature of the wrong length never throws (constant-time compare handles length mismatch)", () => {
  const fields = baseFields();
  assert.doesNotThrow(() => {
    const result = verifyPluginLicense({ ...fields, signature: "abc" }, SECRET);
    assert.equal(result.entitled, false);
  });
});

// ── Anti-enumeration: every failure path returns the identical shape ───────

test("bad signature, wrong secret, expired, and unknown product all return byte-identical response shapes", () => {
  const validFields = baseFields();

  const badSignature = verifyPluginLicense({ ...validFields, signature: "0".repeat(64) }, SECRET);
  const wrongSecret = verifyPluginLicense({ ...validFields, signature: sign(validFields, "other-secret") }, SECRET);
  const expired = verifyPluginLicense(
    { ...baseFields({ expiry: pastExpiry() }), signature: sign(baseFields({ expiry: pastExpiry() })) },
    SECRET
  );
  const unknownProduct = verifyPluginLicense(
    { ...validFields, product: "Nope", signature: "0".repeat(64) },
    SECRET
  );
  const malformed = verifyPluginLicense({}, SECRET);

  const shapes = [badSignature, wrongSecret, expired, unknownProduct, malformed];
  for (const shape of shapes) {
    assert.deepEqual(shape, { entitled: false });
  }
});
