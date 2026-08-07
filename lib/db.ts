import { neon } from "@neondatabase/serverless";
import type { ListSlug } from "@/lib/lists";
import { isValidEmail } from "@/lib/email";

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
  // Backstop for every insert path, present or future — recordSignup()
  // below already rejects malformed addresses, but a raw one-off script
  // (see scripts/import-legacy-signups.mjs, which is exactly how
  // "amy@cosmokitty,com" got in — a comma-for-period typo that passed its
  // old ".includes('@')" check) can still write directly with SQL. This
  // makes bad shape impossible at the table level regardless of which code
  // touches it. Postgres has no "ADD CONSTRAINT IF NOT EXISTS" for CHECK,
  // so swallow the "already exists" error on every warm start after the
  // first.
  try {
    await sql()`
      ALTER TABLE signups
      ADD CONSTRAINT signups_email_shape CHECK (email ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')
    `;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "42710") throw err; // 42710 = duplicate_object (constraint already exists)
  }
  _ensured = true;
}

export async function recordSignup(input: {
  email: string;
  name?: string | null;
  message?: string | null;
  list: ListSlug;
}) {
  await ensureTable();
  const email = input.email.trim();
  if (!isValidEmail(email)) {
    throw new Error(`Not a valid email address: "${email}"`);
  }
  const { name, message, list } = input;
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
//
// Case-insensitive on purpose: sends always go to lower(email) (see
// listRecipients), so an unsubscribe always arrives lowercased — but signups
// are stored exactly as typed. An exact-match DELETE silently removed ZERO
// rows for anyone who signed up as "Name@Example.com", reporting success
// while continuing to email them. Never match addresses by case.
export async function deleteSignup(email: string, list?: string): Promise<number> {
  await ensureTable();
  const e = email.trim().toLowerCase();
  const rows = list
    ? await sql()`DELETE FROM signups WHERE lower(email) = ${e} AND list = ${list} RETURNING id`
    : await sql()`DELETE FROM signups WHERE lower(email) = ${e} RETURNING id`;
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
  // Member votes count for more, scaled to tier (lib/commerce/membership.ts's
  // voteWeightForTier) — 1 for a non-member. Captured at vote time rather
  // than re-derived on every read, matching the same "re-voting overwrites"
  // semantics topics/subscribed already have (an upgrade/downgrade after
  // voting takes effect next time that email votes again, not retroactively).
  await sql()`ALTER TABLE course_votes ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 1`;
  _votesEnsured = true;
}

export async function recordVote(input: {
  email: string;
  topics: string[];
  subscribed: boolean;
  weight: number;
}) {
  await ensureVotesTable();
  const { email, topics, subscribed, weight } = input;
  await sql()`
    INSERT INTO course_votes (email, topics, subscribed, weight)
    VALUES (${email}, ${topics}, ${subscribed}, ${weight})
    ON CONFLICT (email) DO UPDATE
      SET topics = EXCLUDED.topics,
          subscribed = EXCLUDED.subscribed,
          weight = EXCLUDED.weight,
          updated_at = now()
  `;
}

// Aggregate WEIGHTED score per topic, for the public results bars — a
// member's pick counts for their tier's vote weight, not just 1. Never
// exposes individual emails.
export async function getVoteCounts(): Promise<{ topic: string; count: number }[]> {
  await ensureVotesTable();
  const rows = await sql()`
    SELECT topic, SUM(weight)::int AS count
    FROM course_votes, UNNEST(topics) AS topic
    GROUP BY topic
    ORDER BY count DESC
  `;
  return rows as { topic: string; count: number }[];
}

// Total number of PEOPLE who have voted (distinct emails, unweighted) — for
// an honest "N votes so far" line. The per-topic bars above are weighted;
// this deliberately isn't, so it still reads as a real headcount.
export async function getVoteTotalVoters(): Promise<number> {
  await ensureVotesTable();
  const rows = await sql()`SELECT COUNT(*)::int AS count FROM course_votes`;
  return (rows as { count: number }[])[0]?.count ?? 0;
}

// ── Training survey — /training#poll ────────────────────────────────────────
// Every submission is its own row (email is optional, so there's no natural
// dedup key like course_votes has). Purely additive signal for what to teach
// and how to package it.

let _trainingSurveyEnsured = false;

async function ensureTrainingSurveyTable() {
  if (_trainingSurveyEnsured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS training_survey (
      id           BIGSERIAL PRIMARY KEY,
      email        TEXT,
      engagement   TEXT[] NOT NULL,
      topics       TEXT[] NOT NULL,
      ai_stance    TEXT NOT NULL,
      skill_level  TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _trainingSurveyEnsured = true;
}

export async function recordTrainingSurveyResponse(input: {
  email: string | null;
  engagement: string[];
  topics: string[];
  aiStance: string;
  skillLevel: string;
}) {
  await ensureTrainingSurveyTable();
  const { email, engagement, topics, aiStance, skillLevel } = input;
  await sql()`
    INSERT INTO training_survey (email, engagement, topics, ai_stance, skill_level)
    VALUES (${email}, ${engagement}, ${topics}, ${aiStance}, ${skillLevel})
  `;
}

export type TrainingSurveyCounts = {
  engagement: { option: string; count: number }[];
  topics: { option: string; count: number }[];
  aiStance: { option: string; count: number }[];
  skillLevel: { option: string; count: number }[];
  total: number;
};

// Aggregate counts per question, for the public results view. Never exposes
// individual emails or per-response answer combinations.
export async function getTrainingSurveyCounts(): Promise<TrainingSurveyCounts> {
  await ensureTrainingSurveyTable();
  const [engagement, topics, aiStance, skillLevel, totalRows] = await Promise.all([
    sql()`
      SELECT option, COUNT(*)::int AS count
      FROM training_survey, UNNEST(engagement) AS option
      GROUP BY option ORDER BY count DESC
    `,
    sql()`
      SELECT option, COUNT(*)::int AS count
      FROM training_survey, UNNEST(topics) AS option
      GROUP BY option ORDER BY count DESC
    `,
    sql()`
      SELECT ai_stance AS option, COUNT(*)::int AS count
      FROM training_survey GROUP BY ai_stance ORDER BY count DESC
    `,
    sql()`
      SELECT skill_level AS option, COUNT(*)::int AS count
      FROM training_survey GROUP BY skill_level ORDER BY count DESC
    `,
    sql()`SELECT COUNT(*)::int AS count FROM training_survey`,
  ]);
  return {
    engagement: engagement as { option: string; count: number }[],
    topics: topics as { option: string; count: number }[],
    aiStance: aiStance as { option: string; count: number }[],
    skillLevel: skillLevel as { option: string; count: number }[],
    total: (totalRows as { count: number }[])[0]?.count ?? 0,
  };
}

// ── Testimonials ─────────────────────────────────────────────────────────

let _testimonialsEnsured = false;

async function ensureTestimonialsTable() {
  if (_testimonialsEnsured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS testimonials (
      id            BIGSERIAL PRIMARY KEY,
      name          TEXT,
      role_org      TEXT,
      quote         TEXT NOT NULL,
      email         TEXT,
      class_context TEXT,
      approved      BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _testimonialsEnsured = true;
}

export type TestimonialRow = {
  id: number;
  name: string | null;
  role_org: string | null;
  quote: string;
  email: string | null;
  class_context: string | null;
  approved: boolean;
  created_at: string;
};

export async function createTestimonial(input: {
  name?: string | null;
  roleOrg?: string | null;
  quote: string;
  email?: string | null;
  classContext?: string | null;
}): Promise<TestimonialRow> {
  await ensureTestimonialsTable();
  const rows = await sql()`
    INSERT INTO testimonials (name, role_org, quote, email, class_context, approved)
    VALUES (${input.name ?? null}, ${input.roleOrg ?? null}, ${input.quote}, ${input.email ?? null}, ${input.classContext ?? null}, false)
    RETURNING *
  `;
  return (rows as TestimonialRow[])[0];
}

export async function getApprovedTestimonials(): Promise<TestimonialRow[]> {
  await ensureTestimonialsTable();
  const rows = await sql()`
    SELECT * FROM testimonials WHERE approved = true ORDER BY created_at DESC
  `;
  return rows as TestimonialRow[];
}

export async function setTestimonialApproved(id: number, approved: boolean): Promise<number> {
  await ensureTestimonialsTable();
  const rows = await sql()`
    UPDATE testimonials SET approved = ${approved} WHERE id = ${id} RETURNING id
  `;
  return (rows as unknown[]).length;
}

export async function deleteTestimonial(id: number): Promise<number> {
  await ensureTestimonialsTable();
  const rows = await sql()`
    DELETE FROM testimonials WHERE id = ${id} RETURNING id
  `;
  return (rows as unknown[]).length;
}

// ── @alexctraining X bot — OAuth token state ────────────────────────────────
// Single row per account. The OAuth 2.0 refresh token rotates on every use,
// so both fields get overwritten together on each refresh — never just the
// access token.

let _xBotStateEnsured = false;

async function ensureXBotStateTable() {
  if (_xBotStateEnsured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS x_bot_state (
      account       TEXT PRIMARY KEY,
      access_token  TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _xBotStateEnsured = true;
}

export type XBotState = { accessToken: string; refreshToken: string };

export async function getXBotState(account: string): Promise<XBotState | null> {
  await ensureXBotStateTable();
  const rows = await sql()`
    SELECT access_token, refresh_token FROM x_bot_state WHERE account = ${account}
  `;
  const row = (rows as { access_token: string; refresh_token: string }[])[0];
  return row ? { accessToken: row.access_token, refreshToken: row.refresh_token } : null;
}

export async function setXBotState(account: string, state: XBotState): Promise<void> {
  await ensureXBotStateTable();
  await sql()`
    INSERT INTO x_bot_state (account, access_token, refresh_token, updated_at)
    VALUES (${account}, ${state.accessToken}, ${state.refreshToken}, now())
    ON CONFLICT (account) DO UPDATE
      SET access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          updated_at = now()
  `;
}

// ── @alexctraining X bot — tip draft queue ──────────────────────────────────
// Drafts get inserted with status='pending_approval' and a Telegram message
// sent for each; a tap on the inline keyboard flips status to 'approved' or
// 'rejected' via the Telegram webhook. The daily posting cron only ever
// consumes 'approved' rows, oldest first, and marks them 'posted' once sent.

let _tipQueueEnsured = false;

async function ensureTipQueueTable() {
  if (_tipQueueEnsured) return;
  await sql()`
    CREATE TABLE IF NOT EXISTS ue_tip_queue (
      id                  BIGSERIAL PRIMARY KEY,
      account             TEXT NOT NULL,
      text                TEXT NOT NULL,
      source              TEXT,
      status              TEXT NOT NULL DEFAULT 'pending_approval',
      telegram_message_id BIGINT,
      tweet_id            TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      decided_at          TIMESTAMPTZ,
      posted_at           TIMESTAMPTZ
    )
  `;
  _tipQueueEnsured = true;
}

export type TipQueueRow = {
  id: number;
  account: string;
  text: string;
  source: string | null;
  status: string;
  telegram_message_id: number | null;
  tweet_id: string | null;
  created_at: string;
  decided_at: string | null;
  posted_at: string | null;
};

export async function insertDraftTip(input: {
  account: string;
  text: string;
  source?: string | null;
}): Promise<TipQueueRow> {
  await ensureTipQueueTable();
  const rows = await sql()`
    INSERT INTO ue_tip_queue (account, text, source)
    VALUES (${input.account}, ${input.text}, ${input.source ?? null})
    RETURNING *
  `;
  return (rows as TipQueueRow[])[0];
}

export async function setTipTelegramMessageId(id: number, telegramMessageId: number): Promise<void> {
  await ensureTipQueueTable();
  await sql()`
    UPDATE ue_tip_queue SET telegram_message_id = ${telegramMessageId} WHERE id = ${id}
  `;
}

// Looks up a draft by its Telegram message id — the webhook only has the
// message id + callback data to go on, not the queue row id directly.
export async function getTipByTelegramMessageId(telegramMessageId: number): Promise<TipQueueRow | null> {
  await ensureTipQueueTable();
  const rows = await sql()`
    SELECT * FROM ue_tip_queue WHERE telegram_message_id = ${telegramMessageId}
  `;
  return (rows as TipQueueRow[])[0] ?? null;
}

export async function decideTip(id: number, decision: "approved" | "rejected"): Promise<TipQueueRow | null> {
  await ensureTipQueueTable();
  const rows = await sql()`
    UPDATE ue_tip_queue
    SET status = ${decision}, decided_at = now()
    WHERE id = ${id} AND status = 'pending_approval'
    RETURNING *
  `;
  return (rows as TipQueueRow[])[0] ?? null;
}

export async function getNextApprovedUnpostedTip(account: string): Promise<TipQueueRow | null> {
  await ensureTipQueueTable();
  const rows = await sql()`
    SELECT * FROM ue_tip_queue
    WHERE account = ${account} AND status = 'approved'
    ORDER BY decided_at ASC
    LIMIT 1
  `;
  return (rows as TipQueueRow[])[0] ?? null;
}

export async function markTipPosted(id: number, tweetId: string): Promise<void> {
  await ensureTipQueueTable();
  await sql()`
    UPDATE ue_tip_queue SET status = 'posted', tweet_id = ${tweetId}, posted_at = now() WHERE id = ${id}
  `;
}

export async function wasAlreadyPostedToday(account: string, todayEt: string): Promise<boolean> {
  await ensureTipQueueTable();
  const rows = await sql()`
    SELECT id FROM ue_tip_queue
    WHERE account = ${account} AND status = 'posted'
      AND posted_at AT TIME ZONE 'America/New_York' >= ${todayEt}::date
    LIMIT 1
  `;
  return (rows as unknown[]).length > 0;
}

export async function countPendingApproval(account: string): Promise<number> {
  await ensureTipQueueTable();
  const rows = await sql()`
    SELECT COUNT(*)::int AS count FROM ue_tip_queue WHERE account = ${account} AND status = 'pending_approval'
  `;
  return (rows as { count: number }[])[0]?.count ?? 0;
}

export async function listTips(account: string): Promise<TipQueueRow[]> {
  await ensureTipQueueTable();
  const rows = await sql()`
    SELECT * FROM ue_tip_queue WHERE account = ${account} ORDER BY id ASC
  `;
  return rows as TipQueueRow[];
}
