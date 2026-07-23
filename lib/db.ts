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
