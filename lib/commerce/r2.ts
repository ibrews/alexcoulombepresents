// ── Commerce core — Cloudflare R2 (S3-compatible) object delivery ──────────
// Zero-egress object storage. We never link objects directly — the
// storefront hits our own /api/download, which checks the entitlement and
// 302s to a short-lived presigned GET URL.
//
// Required env (Vercel):
//   R2_ACCOUNT_ID       Cloudflare account id
//   R2_ACCESS_KEY_ID    R2 API token access key
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET           bucket name, e.g. "acp-digital-goods"

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not set (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

// Presigned GET URL, valid for a few minutes — matches the design doc's
// "short-lived presigned URL (minutes)" spec.
export async function presignDownloadUrl(objectKey: string, expiresInSeconds = 300): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(client(), cmd, { expiresIn: expiresInSeconds });
}
