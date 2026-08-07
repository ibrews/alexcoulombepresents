// ── Class check-in — min-enrollment go/no-go for the Wednesday calendar ────
// The Tuesday before each dated class (lib/store.ts's wednesdayCalendar),
// the class-checkin cron (app/api/cron/class-checkin) checks paid headcount
// against item.minEnrollment. Under it → Alex gets a Telegram Yes/No prompt
// (lib/telegram.ts's sendClassCheckinPrompt) instead of the class running
// silently undersold. This table just tracks that prompt's lifecycle so the
// cron never re-prompts for the same class twice and the webhook knows what
// a button tap is deciding.

import { neon } from "@neondatabase/serverless";

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
    CREATE TABLE IF NOT EXISTS class_checkins (
      slug                 TEXT PRIMARY KEY,
      telegram_message_id  BIGINT,
      status               TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled
      seats_at_prompt       INTEGER,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      decided_at           TIMESTAMPTZ
    )
  `;
  _ensured = true;
}

export type ClassCheckinRow = {
  slug: string;
  telegram_message_id: number | null;
  status: "pending" | "confirmed" | "cancelled";
  seats_at_prompt: number | null;
  created_at: string;
  decided_at: string | null;
};

export async function getCheckin(slug: string): Promise<ClassCheckinRow | null> {
  await ensureTable();
  const rows = (await sql()`SELECT * FROM class_checkins WHERE slug = ${slug}`) as ClassCheckinRow[];
  return rows[0] ?? null;
}

// Inserted once, the first time a class is found under minEnrollment on its
// Tuesday-before check — never re-inserted, so the cron's "already prompted"
// guard is just "does a row exist at all".
export async function recordCheckinPrompt(input: {
  slug: string;
  telegramMessageId: number;
  seatsAtPrompt: number;
}): Promise<void> {
  await ensureTable();
  await sql()`
    INSERT INTO class_checkins (slug, telegram_message_id, status, seats_at_prompt)
    VALUES (${input.slug}, ${input.telegramMessageId}, 'pending', ${input.seatsAtPrompt})
    ON CONFLICT (slug) DO NOTHING
  `;
}

// Transitions pending → confirmed/cancelled. Returns null if there was no
// pending row (already decided, or a stale/duplicate button tap) so the
// webhook can ack without re-running the cancellation flow twice.
export async function decideCheckin(
  slug: string,
  decision: "confirmed" | "cancelled"
): Promise<ClassCheckinRow | null> {
  await ensureTable();
  const rows = (await sql()`
    UPDATE class_checkins SET status = ${decision}, decided_at = now()
    WHERE slug = ${slug} AND status = 'pending'
    RETURNING *
  `) as ClassCheckinRow[];
  return rows[0] ?? null;
}
