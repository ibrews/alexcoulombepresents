// ── Google Drive service-account client — named-user folder grants ─────────

import crypto from "node:crypto";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

function serviceAccountKey(): ServiceAccountKey {
  const encoded = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY;
  if (!encoded) throw new Error("GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY is not set");
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as ServiceAccountKey;
}

function encodeJwtPart(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

// No caching — this is only called by the low-frequency daily access cron,
// so tracking token expiry across serverless invocations adds complexity
// without helping a hot path.
async function accessToken(): Promise<string> {
  const key = serviceAccountKey();
  const iat = Math.floor(Date.now() / 1000);
  const header = encodeJwtPart({ alg: "RS256", typ: "JWT" });
  const claims = encodeJwtPart({
    iss: key.client_email,
    scope: DRIVE_SCOPE,
    aud: OAUTH_TOKEN_URL,
    iat,
    exp: iat + 60 * 60,
  });
  const unsigned = `${header}.${claims}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Google OAuth token failed (${res.status}): ${JSON.stringify(json)}`);
  if (!json || typeof json.access_token !== "string") {
    throw new Error(`Google OAuth token response was missing access_token: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function call(method: string, path: string, body: Record<string, unknown>): Promise<void> {
  const token = await accessToken();
  const res = await fetch(`${DRIVE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Google Drive ${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
}

export function extractDriveFolderId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "drive.google.com") return null;
    return parsed.pathname.match(/^\/drive\/folders\/([A-Za-z0-9_-]+)\/?$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function shareDriveFolder(folderId: string, email: string): Promise<boolean> {
  try {
    // Omit sendNotificationEmail deliberately: ongoing grants should use
    // Drive's default notification behavior; the silent backfill was manual.
    await call("POST", `/files/${encodeURIComponent(folderId)}/permissions`, {
      role: "reader",
      type: "user",
      emailAddress: email,
    });
    return true;
  } catch (err) {
    console.error(`[drive] shareDriveFolder failed for folder ${folderId}, email ${email}:`, err);
    return false;
  }
}
