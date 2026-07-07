// One-time setup: generate the Ed25519 license-signing keypair.
// Run: npx tsx scripts/generate-license-keypair.ts
// Copy the two PEM blocks into Vercel env vars:
//   LICENSE_SIGNING_PRIVATE_KEY  (secret, server-only)
//   LICENSE_SIGNING_PUBLIC_KEY   (not secret — also ships inside product zips)
// Store both as single-line env values with literal "\n" for newlines, or
// paste multi-line as-is if the host supports it (Vercel does).

import crypto from "node:crypto";

const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");

console.log("── LICENSE_SIGNING_PRIVATE_KEY ──────────────────────────────");
console.log(privateKey.export({ type: "pkcs8", format: "pem" }).toString());
console.log("── LICENSE_SIGNING_PUBLIC_KEY ───────────────────────────────");
console.log(publicKey.export({ type: "spki", format: "pem" }).toString());
