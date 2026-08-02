// ── X (Twitter) API — @alexctraining posting ────────────────────────────────
// OAuth 2.0 user-context. Access tokens expire ~2h after issuance, so every
// post refreshes first. X rotates the refresh token on every use — the new
// pair is persisted to x_bot_state (see lib/db.ts) before the tweet goes out,
// so a post failure never strands the account on an already-spent refresh
// token. Credentials + full recipe: ~/knowledge/secrets/x-api-alexctraining.md

import { getXBotState, setXBotState } from "@/lib/db";

export const X_ACCOUNT = "alexctraining";

function clientId(): string {
  const id = process.env.X_CLIENT_ID;
  if (!id) throw new Error("X_CLIENT_ID is not set");
  return id;
}

function clientSecret(): string {
  const secret = process.env.X_CLIENT_SECRET;
  if (!secret) throw new Error("X_CLIENT_SECRET is not set");
  return secret;
}

async function refreshAccessToken(): Promise<string> {
  const state = await getXBotState(X_ACCOUNT);
  // First-ever run (or a wiped table): fall back to a one-time bootstrap
  // refresh token in env. Once this refresh succeeds, the DB row exists and
  // every call after this one uses it instead — X_INITIAL_REFRESH_TOKEN is
  // dead weight from that point on, safe to leave set or remove.
  const refreshToken = state?.refreshToken ?? process.env.X_INITIAL_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      `No x_bot_state row for account "${X_ACCOUNT}" and no X_INITIAL_REFRESH_TOKEN env var to bootstrap from`
    );
  }

  const basic = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");
  const res = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`X token refresh failed: ${JSON.stringify(json)}`);

  await setXBotState(X_ACCOUNT, { accessToken: json.access_token, refreshToken: json.refresh_token });
  return json.access_token as string;
}

export async function postTweet(text: string): Promise<{ id: string; text: string }> {
  const accessToken = await refreshAccessToken();
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`X post failed: ${JSON.stringify(json)}`);
  return json.data as { id: string; text: string };
}
