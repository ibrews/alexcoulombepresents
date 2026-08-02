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
