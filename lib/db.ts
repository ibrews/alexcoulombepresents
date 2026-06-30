import { neon } from "@neondatabase/serverless";
import type { ListSlug } from "@/lib/lists";

// Lazy singleton — never touch the DB at module load / build time.
let _sql: ReturnType<typeof neon> | null = null;
let _ensured = false;

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_sql) _sql = neon(url);
  return _sql;
}

// Idempotent schema bootstrap — cheap, runs once per warm instance.
async function ensureTable() {
  if (_ensured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS signups (
      id         BIGSERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      name       TEXT,
      message    TEXT,
      list       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (email, list)
    )
  `;
  _ensured = true;
}

export async function recordSignup(input: {
  email: string;
  name?: string | null;
  message?: string | null;
  list: ListSlug;
}) {
  await ensureTable();
  const { email, name, message, list } = input;
  // Re-signups update name/message but keep the original created_at.
  await sql()`
    INSERT INTO signups (email, name, message, list)
    VALUES (${email}, ${name ?? null}, ${message ?? null}, ${list})
    ON CONFLICT (email, list) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, signups.name),
          message = COALESCE(EXCLUDED.message, signups.message)
  `;
}

export type SignupRow = {
  id: number;
  email: string;
  name: string | null;
  message: string | null;
  list: string;
  created_at: string;
};

// Read signups, optionally filtered to a single list (newest first).
export async function getSignups(list?: string): Promise<SignupRow[]> {
  await ensureTable();
  const rows = list
    ? await sql()`SELECT * FROM signups WHERE list = ${list} ORDER BY created_at DESC`
    : await sql()`SELECT * FROM signups ORDER BY created_at DESC`;
  return rows as SignupRow[];
}

// Remove a signup (admin cleanup / unsubscribe). Scoped to one list, or all
// lists when `list` is omitted. Returns how many rows were deleted.
export async function deleteSignup(email: string, list?: string): Promise<number> {
  await ensureTable();
  const rows = list
    ? await sql()`DELETE FROM signups WHERE email = ${email} AND list = ${list} RETURNING id`
    : await sql()`DELETE FROM signups WHERE email = ${email} RETURNING id`;
  return (rows as unknown[]).length;
}

// Per-list counts for an at-a-glance dashboard.
export async function getListCounts(): Promise<{ list: string; count: number }[]> {
  await ensureTable();
  const rows = await sql()`
    SELECT list, COUNT(*)::int AS count FROM signups GROUP BY list ORDER BY count DESC
  `;
  return rows as { list: string; count: number }[];
}
