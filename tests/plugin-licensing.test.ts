// ── UE plugin ACPL2 license round-trip test ────────────────────────────────
// Runs on Node's built-in test runner (node --test, type stripping — no test
// framework dependency), same pattern as member-licensing.test.ts and
// membership-webhook.test.ts.
//
// Proves the site's issuing path (mintPluginLicenseIfApplicable) produces a
// license file whose signature verifies against a FAITHFUL PORT of the
// vendored plugin checker's own verification logic — not against this
// module's own (possibly buggy) verifier, which would just be testing the
// code against itself.
//
// Checker reference, read directly from the vendored templates in
// /Users/Shared/GH/acp-dist-tools (same canonicalization in both lanes,
// only the secret differs):
//   python/acp_license.py::compute_signature()
//     payload = f"ACPL2|{product}|{licensee}|{email}|{tier}|{seats}|{expiry}"
//     hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()
//   native/ACPLicense.h's ComputeSignature() doc comment:
//     "ACPL2|product|licensee|email|tier|seats|expiry" — matches
//     python/acp_license.py::compute_signature() exactly.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mintPluginLicenseIfApplicable } from "../lib/commerce/pluginLicensing.ts";

const TEST_SECRET = "test-only-acpl2-secret-do-not-use-in-prod";

/**
 * Faithful port of the vendored checker's compute_signature(), independent
 * of anything in pluginLicensing.ts — this is what URMBridge/SceneAudit/
 * Forage/BPAutoLayout/URKPreviewer actually run at license-check time.
 */
function checkerComputeSignature(
  product: string,
  licensee: string,
  email: string,
  tier: string,
  seats: string | number,
  expiry: string,
  secret: string
): string {
  const payload = `ACPL2|${product}|${licensee}|${email}|${tier}|${seats}|${expiry}`;
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Parses "ACPL2|product|licensee|email|tier|seats|expiry|signature". */
function parseLicenseFile(licenseFile: string) {
  const parts = licenseFile.split("|");
  assert.equal(parts.length, 8, `expected 8 pipe-delimited fields, got ${parts.length}: ${licenseFile}`);
  const [header, product, licensee, email, tier, seats, expiry, signature] = parts;
  assert.equal(header, "ACPL2", `license file must start with the ACPL2 header, got "${header}"`);
  return { product, licensee, email, tier, seats, expiry, signature };
}

test("a license issued by the site's pluginLicensing.ts validates against the vendored plugin checker's own HMAC", async () => {
  process.env.ACP_PLUGIN_LICENSE_SECRET = TEST_SECRET;

  const { licenseFile } = await mintPluginLicenseIfApplicable({
    product: "URKPreviewer",
    licensee: "Test Licensee",
    email: "test@example.com",
    tier: "com",
    seats: 1,
    expiryDays: 365,
  });

  const { product, licensee, email, tier, seats, expiry, signature } = parseLicenseFile(licenseFile);

  const expectedByChecker = checkerComputeSignature(product, licensee, email, tier, seats, expiry, TEST_SECRET);

  assert.equal(
    signature,
    expectedByChecker,
    "the signature the site issued does not match what the vendored ACPL2 checker (python/acp_license.py, " +
      "native/ACPLicense.h) would compute for the same fields and secret — a site-issued key fails validation " +
      "in the plugin"
  );
});
