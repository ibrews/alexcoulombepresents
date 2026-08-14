#!/usr/bin/env node
// ── Upload a big class material to R2 ──────────────────────────────────────
//
//   node scripts/upload-class-material.mjs <local-file> <r2-key>
//
// e.g.
//   node scripts/upload-class-material.mjs \
//     ~/Downloads/216.03_UET_53.zip \
//     class-materials/wed-2026-08-12-intro-vr/216.03_UET_53.zip
//
// The r2-key must match the `source.key` of the matching entry in
// lib/classMaterials.ts — that entry is what makes the file appear (and stay
// gated) at /materials/<class>.
//
// ── Credentials ────────────────────────────────────────────────────────────
// R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET, from
// the environment or a local .env file passed as --env <path>.
//
// These are marked "Sensitive" in the Vercel project, which means
// `vercel env pull` returns the literal string [SENSITIVE] rather than the
// value — they are write-only there by design. Get them from the Cloudflare
// dashboard (R2 → Manage API tokens) instead; don't burn time on `env pull`.
//
// ── Why multipart, always ──────────────────────────────────────────────────
// R2 caps a single PutObject at 5 GiB. The Intro-to-VR project is 6.1 GB, so
// the obvious one-shot upload fails outright on exactly the file this script
// exists for. Multipart is not an optimization here, it is the only path —
// so this always uses it rather than branching on size and leaving the big
// case untested.

import { createReadStream, statSync, readFileSync } from "node:fs";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const PART_SIZE = 100 * 1024 * 1024; // 100 MB — 6.1 GB → 62 parts, well under the 10k limit

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--env") args.env = argv[++i];
    else if (argv[i] === "--dry-run") args.dryRun = true;
    else args.positional.push(argv[i]);
  }
  return args;
}

function loadEnvFile(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.includes("=") || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const { positional, env: envPath, dryRun } = parseArgs(process.argv.slice(2));
const [localFile, key] = positional;

if (!localFile || !key) {
  console.error("usage: upload-class-material.mjs <local-file> <r2-key> [--env <file>] [--dry-run]");
  process.exit(2);
}

const env = { ...process.env, ...(envPath ? loadEnvFile(envPath) : {}) };
const missing = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].filter(
  (k) => !env[k] || env[k] === "[SENSITIVE]"
);
if (missing.length) {
  console.error(`Missing or redacted R2 credentials: ${missing.join(", ")}`);
  console.error("Get them from Cloudflare → R2 → Manage API tokens. `vercel env pull` will NOT");
  console.error("work: these are marked Sensitive there and pull back as the literal [SENSITIVE].");
  process.exit(1);
}

const { size } = statSync(localFile);
const parts = Math.ceil(size / PART_SIZE);
console.log(`${localFile}`);
console.log(`  → s3://${env.R2_BUCKET}/${key}`);
// GiB, spelled out — macOS Finder reports decimal GB, so an unlabeled "5.71"
// next to a "6.1 GB" file listing reads like a truncated upload.
console.log(`  ${(size / 1024 ** 3).toFixed(2)} GiB (${(size / 1000 ** 3).toFixed(1)} GB) in ${parts} part(s) of ${PART_SIZE / 1024 ** 2} MiB`);
if (dryRun) process.exit(0);

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// Read exactly `length` bytes starting at `start`. Buffered rather than
// streamed per part because R2 needs a known Content-Length for each part,
// and a stream of unknown length makes the SDK buffer it anyway.
function readChunk(path, start, length) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    createReadStream(path, { start, end: start + length - 1 })
      .on("data", (c) => chunks.push(c))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });
}

let uploadId;
try {
  ({ UploadId: uploadId } = await client.send(
    new CreateMultipartUploadCommand({ Bucket: env.R2_BUCKET, Key: key })
  ));

  const completed = [];
  for (let i = 0; i < parts; i++) {
    const start = i * PART_SIZE;
    const length = Math.min(PART_SIZE, size - start);
    const body = await readChunk(localFile, start, length);
    const { ETag } = await client.send(
      new UploadPartCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: i + 1,
        Body: body,
      })
    );
    completed.push({ ETag, PartNumber: i + 1 });
    const pct = (((i + 1) / parts) * 100).toFixed(1);
    process.stdout.write(`\r  uploaded ${i + 1}/${parts} parts (${pct}%)   `);
  }
  process.stdout.write("\n");

  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: completed },
    })
  );
} catch (err) {
  if (uploadId) {
    // An abandoned multipart upload keeps billing for its parts forever —
    // always clean up rather than leaving invisible storage behind.
    await client
      .send(new AbortMultipartUploadCommand({ Bucket: env.R2_BUCKET, Key: key, UploadId: uploadId }))
      .catch(() => {});
    console.error("\nUpload aborted and cleaned up.");
  }
  console.error(err);
  process.exit(1);
}

// Verify by reading back what the bucket actually holds — an upload that
// "succeeded" but stored the wrong number of bytes is the failure worth
// catching here, and it costs one HEAD request.
const head = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
if (head.ContentLength !== size) {
  console.error(`MISMATCH: local ${size} bytes, remote ${head.ContentLength} bytes`);
  process.exit(1);
}
console.log(`✓ ${key} — ${head.ContentLength} bytes, verified against the local file.`);
console.log("The Download button on /materials/<class> goes live immediately; no deploy needed.");
