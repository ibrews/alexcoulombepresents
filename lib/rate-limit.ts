// ── Rate limiting — Neon-backed fixed window ────────────────────────────────
// Serverless-safe (state lives in Postgres, not instance memory). Fails OPEN:
// if the DB is unreachable the request proceeds — a signup or checkout must
// never break because the rate-limit table hiccuped.

import { neon } from "@neondatabase/serverless";
import type { NextRequest } from "next/server";

let _sql: ReturnType<typeof neon> | null = null;
let _ensured = false;

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_sql) _sql = neon(url);
  return _sql;
}

async function ensureTable() {
  if (_ensured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key          TEXT PRIMARY KEY,
      window_start TIMESTAMPTZ NOT NULL,
      count        INTEGER NOT NULL
    )
  `;
  _ensured = true;
}

/** Best-effort client IP on Vercel (first hop of x-forwarded-for). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window counter. Returns true when the request is ALLOWED.
 * key should namespace the route + caller, e.g. `subscribe:1.2.3.4`.
 */
export async function rateLimitAllows(
  key: string,
  limit: number,
  windowSecs: number
): Promise<boolean> {
  try {
    await ensureTable();
    const rows = (await sql()`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, now(), 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSecs})
          THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSecs})
          THEN now()
          ELSE rate_limits.window_start
        END
      RETURNING count
    `) as { count: number }[];
    return (rows[0]?.count ?? 1) <= limit;
  } catch (err) {
    console.error("[rate-limit] check failed (failing open):", err);
    return true;
  }
}

/** Standard 429 body shared by the public POST routes. */
export const RATE_LIMITED_MESSAGE =
  "Too many requests — please wait a minute and try again, or email info@alexcoulombepresents.com.";
