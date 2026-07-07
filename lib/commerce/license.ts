// ── Commerce core — Ed25519 offline-verifiable license keys ────────────────
// No npm dependency: Node's built-in `crypto` module has native Ed25519
// sign/verify (crypto.sign/crypto.verify with a null algorithm). The private
// key never leaves the server; the public key ships inside sold packages so
// buyers (and our own `verify_pipeline.py`) can validate offline.
//
// Keypair generation: run `npx tsx scripts/generate-license-keypair.ts` once.
// Store the private key as LICENSE_SIGNING_PRIVATE_KEY (PEM, base64-safe via
// env), never commit it. The public key is not secret — publish it in each
// product's bundled license.py / verify docs.

import crypto from "node:crypto";

export type LicensePayload = {
  sku: string;
  tier: string;
  seats: number;
  licensee_email: string;
  major_version: number;
  updates_until: string; // ISO date
  issued_at: string; // ISO date
};

function privateKey(): crypto.KeyObject {
  const pem = process.env.LICENSE_SIGNING_PRIVATE_KEY;
  if (!pem) throw new Error("LICENSE_SIGNING_PRIVATE_KEY is not set");
  return crypto.createPrivateKey(pem.replace(/\\n/g, "\n"));
}

export function publicKeyPem(): string {
  const pem = process.env.LICENSE_SIGNING_PUBLIC_KEY;
  if (!pem) throw new Error("LICENSE_SIGNING_PUBLIC_KEY is not set");
  return pem.replace(/\\n/g, "\n");
}

// Signed key format: base64url(JSON payload) + "." + base64url(signature).
// Deliberately simple (not JWT) — the whole point is a ~20-line verifier on
// the buyer's side (see the license.py this mirrors).
export function issueLicenseKey(payload: LicensePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = crypto.sign(null, body, privateKey());
  return `${body.toString("base64url")}.${sig.toString("base64url")}`;
}

export function verifyLicenseKey(key: string): LicensePayload | null {
  const [bodyB64, sigB64] = key.split(".");
  if (!bodyB64 || !sigB64) return null;
  try {
    const body = Buffer.from(bodyB64, "base64url");
    const sig = Buffer.from(sigB64, "base64url");
    const ok = crypto.verify(null, body, crypto.createPublicKey(publicKeyPem()), sig);
    if (!ok) return null;
    return JSON.parse(body.toString("utf8")) as LicensePayload;
  } catch {
    return null;
  }
}
