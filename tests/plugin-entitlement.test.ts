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
import {
  PLUGIN_LANES,
  pluginLane,
  requirePluginLicenseSecret,
  verifyPluginLicense,
  type PluginLicenseFields,
} from "../lib/commerce/pluginLicensing.ts";

const SECRET = "test-secret-not-real";

// Mirrors computeSignature() in lib/commerce/pluginLicensing.ts — deliberately
// reimplemented here (not imported) so the test proves the route's algorithm
// against an independent implementation of the documented spec, not just
// against itself. The "ACPL2" header is part of the signed payload — it
// must match the vendored plugin checkers' own compute_signature()
// (python/acp_license.py, native/ACPLicense.h), which sign
// "ACPL2|product|licensee|email|tier|seats|expiry", not just the field tail.
// See tests/plugin-licensing.test.ts for the round-trip proof against a
// faithful port of the checker itself.
function sign(fields: PluginLicenseFields, secret = SECRET): string {
  const message = [
    "ACPL2",
    fields.product,
    fields.licensee,
    fields.email,
    fields.tier,
    fields.seats,
    fields.expiry,
  ].join("|");
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

// ── Lane separation: py and native plugins sign with DIFFERENT secrets ─────
// Mirrors acp-dist-tools/secrets/secrets.py's `_SECRET_PY` / `_SECRET_NATIVE`
// split. The site used to verify all five products against one
// `ACP_PLUGIN_LICENSE_SECRET`, which both discarded the lane isolation (a
// trivially-decompilable .pyc leak would have minted licenses for the
// symbol-stripped native plugins too) and could never have worked — whichever
// lane that one value belonged to, the other lane's licenses would all fail.

const PY_SECRET = "py-lane-secret-not-real";
const NATIVE_SECRET = "native-lane-secret-not-real";

test("PLUGIN_LANES matches acp-dist-tools' lane assignment exactly", () => {
  assert.deepEqual(PLUGIN_LANES, {
    URMBridge: "py",
    SceneAudit: "py",
    Forage: "native",
    BPAutoLayout: "native",
    URKPreviewer: "native",
  });
});

test("a license signed with its own lane's secret verifies", () => {
  for (const product of ["URMBridge", "SceneAudit", "Forage", "BPAutoLayout", "URKPreviewer"] as const) {
    const secret = pluginLane(product) === "py" ? PY_SECRET : NATIVE_SECRET;
    const fields = baseFields({ product });
    const result = verifyPluginLicense({ ...fields, signature: sign(fields, secret) }, secret);
    assert.equal(result.entitled, true, `${product} should verify against its own lane secret`);
  }
});

test("a license signed by the OTHER lane's secret is rejected", () => {
  for (const product of ["URMBridge", "SceneAudit", "Forage", "BPAutoLayout", "URKPreviewer"] as const) {
    const own = pluginLane(product) === "py" ? PY_SECRET : NATIVE_SECRET;
    const other = own === PY_SECRET ? NATIVE_SECRET : PY_SECRET;
    // Signed with the wrong lane, verified with the right one.
    const fields = baseFields({ product });
    const result = verifyPluginLicense({ ...fields, signature: sign(fields, other) }, own);
    assert.equal(result.entitled, false, `${product} must not accept a cross-lane signature`);
  }
});

test("requirePluginLicenseSecret reads the env var for the product's lane", () => {
  const prevPy = process.env.ACP_PLUGIN_LICENSE_SECRET_PY;
  const prevNative = process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE;
  try {
    process.env.ACP_PLUGIN_LICENSE_SECRET_PY = PY_SECRET;
    process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE = NATIVE_SECRET;
    assert.equal(requirePluginLicenseSecret("URMBridge"), PY_SECRET);
    assert.equal(requirePluginLicenseSecret("SceneAudit"), PY_SECRET);
    assert.equal(requirePluginLicenseSecret("Forage"), NATIVE_SECRET);
    assert.equal(requirePluginLicenseSecret("BPAutoLayout"), NATIVE_SECRET);
    assert.equal(requirePluginLicenseSecret("URKPreviewer"), NATIVE_SECRET);
  } finally {
    process.env.ACP_PLUGIN_LICENSE_SECRET_PY = prevPy;
    process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE = prevNative;
    if (prevPy === undefined) delete process.env.ACP_PLUGIN_LICENSE_SECRET_PY;
    if (prevNative === undefined) delete process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE;
  }
});

test("requirePluginLicenseSecret fails closed, naming the missing lane var", () => {
  const prev = process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE;
  const prevLegacy = process.env.ACP_PLUGIN_LICENSE_SECRET;
  try {
    delete process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE;
    // A legacy single-secret value must NOT satisfy a lane: silently using it
    // would reject every license of the other lane as if it were forged.
    process.env.ACP_PLUGIN_LICENSE_SECRET = "legacy-single-secret";
    assert.throws(
      () => requirePluginLicenseSecret("Forage"),
      /ACP_PLUGIN_LICENSE_SECRET_NATIVE is not set/
    );
  } finally {
    if (prev === undefined) delete process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE;
    else process.env.ACP_PLUGIN_LICENSE_SECRET_NATIVE = prev;
    if (prevLegacy === undefined) delete process.env.ACP_PLUGIN_LICENSE_SECRET;
    else process.env.ACP_PLUGIN_LICENSE_SECRET = prevLegacy;
  }
});
