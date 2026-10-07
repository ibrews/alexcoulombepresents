// ── UE plugin licensing — HMAC-signed offline license verification ─────────
// UE plugins (URMBridge, SceneAudit, Forage, BPAutoLayout, URKPreviewer) ship
// with a license file in this pipe-delimited format (spec lives in the
// sibling `acp-dist-tools` repo, mirrored here — this file doesn't depend on
// that repo, just the format):
//
//   ACPL2|<product>|<licensee>|<email>|<tier>|<seats>|<expiry>|<signature>
//
//   signature = HMAC-SHA256(ACPL2|product|licensee|email|tier|seats|expiry, SECRET)
//               hex-encoded
//
// The plugin's own HTTP client sends the parsed fields of a license file it
// already has (not a separate auth token) to /api/plugins/entitlement, and
// this module recomputes the signature server-side. THE HMAC IS THE SOURCE
// OF TRUTH: there is no license-issuance table yet, so "signature verifies"
// is sufficient — see verifyPluginLicense's docstring for the one caveat
// (com-tier expiry) that's a known simplification, not a gap in this logic.
//
// Secrets: TWO, split by lane, matching acp-dist-tools/secrets/secrets.py.
// `ACP_PLUGIN_LICENSE_SECRET_PY` signs the pure-Python plugins and
// `ACP_PLUGIN_LICENSE_SECRET_NATIVE` the compiled C++ ones — see
// PLUGIN_LANES below for why one shared value would be a downgrade. Env
// only, never hardcoded; requirePluginLicenseSecret fails closed with a
// thrown error rather than silently treating every license as valid.

import crypto from "node:crypto";

export const PLUGIN_PRODUCTS = ["URMBridge", "SceneAudit", "Forage", "BPAutoLayout", "URKPreviewer"] as const;
export type PluginProduct = (typeof PLUGIN_PRODUCTS)[number];

export type PluginTier = "edu" | "com";

export type PluginLane = "py" | "native";

/**
 * Which secret signs which product. This MUST stay in lockstep with
 * `acp-dist-tools/secrets/secrets.py` (`_SECRET_PY` / `_SECRET_NATIVE`),
 * which is the issuing side of the same HMAC.
 *
 * Why two secrets and not one: the `py` plugins embed their key in compiled
 * `.pyc` bytecode, which `uncompyle6` reverses close to trivially. The
 * `native` plugins embed theirs in a symbol-stripped `.dylib`/`.dll`, a far
 * harder target. If one value signed all five, cracking the EASY target
 * would mint valid licenses for the HARD ones — so a Python-side leak must
 * cap its damage at the two Python plugins. Verifying every product against
 * a single `ACP_PLUGIN_LICENSE_SECRET` silently threw that property away,
 * and additionally could never have worked: whichever lane the one value
 * belonged to, every license from the other lane would fail to verify.
 */
export const PLUGIN_LANES: Record<PluginProduct, PluginLane> = {
  URMBridge: "py",
  SceneAudit: "py",
  Forage: "native",
  BPAutoLayout: "native",
  URKPreviewer: "native",
};

export function pluginLane(product: PluginProduct): PluginLane {
  return PLUGIN_LANES[product];
}

export type PluginLicenseFields = {
  product: PluginProduct;
  licensee: string;
  email: string;
  tier: PluginTier;
  seats: string | number;
  expiry: string; // ISO date, e.g. "2027-08-06"
};

export type PluginEntitlementResult =
  | { entitled: true; product: PluginProduct; tier: PluginTier; expiry: string }
  | { entitled: false };

export function isPluginProduct(v: unknown): v is PluginProduct {
  return typeof v === "string" && (PLUGIN_PRODUCTS as readonly string[]).includes(v);
}

function isPluginTier(v: unknown): v is PluginTier {
  return v === "edu" || v === "com";
}

/**
 * Recompute the HMAC-SHA256 hex signature for the pipe-joined license
 * fields, PREFIXED with the "ACPL2" header — this must exactly match every
 * vendored plugin checker's own computation (python/acp_license.py::
 * compute_signature(), native/ACPLicense.h's ComputeSignature()), both of
 * which sign "ACPL2|product|licensee|email|tier|seats|expiry", not just the
 * field tail. Omitting the prefix here made every site-issued key fail
 * validation in the plugin (2026-10-06 finding, see
 * intelligence/decisions/2026-10-06-acpl2-native-secret-public-exposure.md).
 */
function computeSignature(fields: PluginLicenseFields, secret: string): string {
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

/**
 * Constant-time compare of two signature strings. Hashes both sides to a
 * fixed 32-byte digest first, so a length mismatch (a tampered, truncated,
 * or malformed signature) can never throw — crypto.timingSafeEqual requires
 * equal-length buffers, and letting that throw would leak a distinguishable
 * signal (500 vs 200 vs plain `false`) between "wrong length" and "wrong
 * bytes," exactly the kind of side channel this function exists to avoid.
 */
function signaturesMatch(a: string, b: string): boolean {
  const bufA = crypto.createHash("sha256").update(a, "utf8").digest();
  const bufB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

const LANE_ENV_VAR: Record<PluginLane, string> = {
  py: "ACP_PLUGIN_LICENSE_SECRET_PY",
  native: "ACP_PLUGIN_LICENSE_SECRET_NATIVE",
};

/**
 * The signing secret for `product`'s lane.
 *
 * Deliberately NO fallback to a single legacy `ACP_PLUGIN_LICENSE_SECRET`:
 * one value cannot be correct for both lanes, so a fallback would silently
 * reject every license of whichever lane it did not belong to — a failure
 * that looks identical to "this customer's license is forged." Throwing
 * names the exact variable to set instead.
 */
export function requirePluginLicenseSecret(product: PluginProduct): string {
  const lane = pluginLane(product);
  const varName = LANE_ENV_VAR[lane];
  const secret = process.env[varName];
  if (!secret) {
    throw new Error(
      `${varName} is not set (required to verify ${lane}-lane plugin licenses, ` +
        `i.e. ${PLUGIN_PRODUCTS.filter((p) => PLUGIN_LANES[p] === lane).join(", ")})`
    );
  }
  return secret;
}

/**
 * Verify a submitted license's fields + signature and compute entitlement.
 *
 * Anti-enumeration: EVERY failure path (malformed input, unknown product,
 * bad signature, expired license) returns the identical `{ entitled: false
 * }` shape — never a distinguishing reason. Callers (the route) must not add
 * fields to that shape or branch on *why* it failed.
 *
 * KNOWN SIMPLIFICATION: the full edu/com design distinguishes edu (hard
 * expiry) from com (a rolling window relative to the plugin binary's
 * BUILD_DATE) — but BUILD_DATE isn't part of this request payload, so for
 * `com` tier this falls back to the same `today <= expiry` check as `edu`.
 * Revisit once the plugin sends BUILD_DATE too.
 */
export function verifyPluginLicense(
  input: {
    product?: unknown;
    licensee?: unknown;
    email?: unknown;
    tier?: unknown;
    seats?: unknown;
    expiry?: unknown;
    signature?: unknown;
  },
  secret: string,
  now: Date = new Date()
): PluginEntitlementResult {
  const { product, licensee, email, tier, seats, expiry, signature } = input ?? {};

  if (
    !isPluginProduct(product) ||
    typeof licensee !== "string" ||
    !licensee ||
    typeof email !== "string" ||
    !email ||
    !isPluginTier(tier) ||
    (typeof seats !== "string" && typeof seats !== "number") ||
    typeof expiry !== "string" ||
    !expiry ||
    typeof signature !== "string" ||
    !signature
  ) {
    return { entitled: false };
  }

  const fields: PluginLicenseFields = { product, licensee, email, tier, seats, expiry };
  const expected = computeSignature(fields, secret);
  if (!signaturesMatch(expected, signature)) {
    return { entitled: false };
  }

  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime()) || now.getTime() > expiryDate.getTime()) {
    return { entitled: false };
  }

  return { entitled: true, product, tier, expiry };
}

// ── Future webhook hook — NOT wired in ──────────────────────────────────────
// When plugin purchases start flowing through Stripe Checkout (a future
// `kind: "plugin"` metadata branch), the webhook would mint + email a
// license here. This is a reference implementation only — it is deliberately
// NOT called from app/api/stripe-webhook/route.ts in this pass. Wiring it in
// is a separate, reviewed change against the live webhook. Sketch of the
// call site it would need, left commented so it's discoverable without being
// active:
//
//   // in app/api/stripe-webhook/route.ts, inside the checkout.session.completed
//   // branch, alongside the existing `kind === "digital"` / `kind === "donation"` arms:
//   //
//   // } else if (kind === "plugin" && product && email) {
//   //   const { licenseFile } = await mintPluginLicenseIfApplicable({
//   //     product, licensee: name ?? email, email, tier, seats: 1, expiryDays: 365,
//   //   });
//   //   await sendPluginLicenseEmail({ email, product, licenseFile }); // TODO: doesn't exist yet
//   // }
export async function mintPluginLicenseIfApplicable(input: {
  product: PluginProduct;
  licensee: string;
  email: string;
  tier: PluginTier;
  seats: number;
  expiryDays: number;
}): Promise<{ licenseFile: string }> {
  const secret = requirePluginLicenseSecret(input.product);
  const expiry = new Date(Date.now() + input.expiryDays * 86_400_000).toISOString().slice(0, 10);
  const fields: PluginLicenseFields = {
    product: input.product,
    licensee: input.licensee,
    email: input.email,
    tier: input.tier,
    seats: input.seats,
    expiry,
  };
  const signature = computeSignature(fields, secret);
  const licenseFile = [
    "ACPL2",
    fields.product,
    fields.licensee,
    fields.email,
    fields.tier,
    fields.seats,
    fields.expiry,
    signature,
  ].join("|");
  return { licenseFile };
}
