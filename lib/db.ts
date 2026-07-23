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

// ── Course votes — /vote's "what should Alex teach next?" poll ─────────────
// One row per email; re-voting upserts (replaces the topic set, doesn't add).

let _votesEnsured = false;

async function ensureVotesTable() {
  if (_votesEnsured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS course_votes (
      id           BIGSERIAL PRIMARY KEY,
      email        TEXT NOT NULL UNIQUE,
      topics       TEXT[] NOT NULL,
      subscribed   BOOLEAN NOT NULL DEFAULT false,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _votesEnsured = true;
}

export async function recordVote(input: {
  email: string;
  topics: string[];
  subscribed: boolean;
}) {
  await ensureVotesTable();
  const { email, topics, subscribed } = input;
  await sql()`
    INSERT INTO course_votes (email, topics, subscribed)
    VALUES (${email}, ${topics}, ${subscribed})
    ON CONFLICT (email) DO UPDATE
      SET topics = EXCLUDED.topics,
          subscribed = EXCLUDED.subscribed,
          updated_at = now()
  `;
}

// Aggregate counts per topic, for the public results bars. Never exposes
// individual emails.
export async function getVoteCounts(): Promise<{ topic: string; count: number }[]> {
  await ensureVotesTable();
  const rows = await sql()`
    SELECT topic, COUNT(*)::int AS count
    FROM course_votes, UNNEST(topics) AS topic
    GROUP BY topic
    ORDER BY count DESC
  `;
  return rows as { topic: string; count: number }[];
}

// Total number of people who have voted (distinct emails), for a "N votes so
// far" line alongside the per-topic bars.
export async function getVoteTotalVoters(): Promise<number> {
  await ensureVotesTable();
  const rows = await sql()`SELECT COUNT(*)::int AS count FROM course_votes`;
  return (rows as { count: number }[])[0]?.count ?? 0;
}
