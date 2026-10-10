#!/usr/bin/env node

import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const rehearsalDir = path.join(root, ".rehearsal");
const databaseDir = path.join(rehearsalDir, "pglite");
const stateFile = path.join(rehearsalDir, "state.json");
const preloadFile = path.join(scriptDir, "second-brain-rehearsal-preload.mjs");
const authSecret = "second-brain-rehearsal-fixture-auth-secret-v1";
const cronSecret = "rehearsal-cron-secret";
const databaseUrl = "postgresql://rehearsal:rehearsal@rehearsal.invalid/rehearsal";

export const fixtures = Object.freeze({
  "active-starter": { id: 1101, email: "starter@rehearsal.invalid", name: "Rehearsal Starter", membership: ["starter", "active", "2027-12-31T23:59:59Z"] },
  "active-unlimited": { id: 1102, email: "unlimited@rehearsal.invalid", name: "Rehearsal Unlimited", membership: ["unlimited", "active", "2027-12-31T23:59:59Z"] },
  "active-insider": { id: 1103, email: "insider@rehearsal.invalid", name: "Rehearsal Insider", membership: ["insider", "active", null] },
  "expired-member": { id: 1104, email: "expired@rehearsal.invalid", name: "Rehearsal Expired", membership: ["starter", "active", "2026-01-01T00:00:00Z"] },
  "revoked-member": { id: 1105, email: "revoked@rehearsal.invalid", name: "Rehearsal Revoked", membership: ["unlimited", "revoked", "2027-12-31T23:59:59Z"] },
  "memberless": { id: 1106, email: "memberless@rehearsal.invalid", name: "Rehearsal Memberless" },
  "nov4-buyer": { id: 1107, email: "nov4-buyer@rehearsal.invalid", name: "Rehearsal Nov 4 Buyer", order: ["wed-2026-11-04-creative-ai-masterclass-1", false] },
  "nov11-buyer": { id: 1108, email: "nov11-buyer@rehearsal.invalid", name: "Rehearsal Nov 11 Buyer", order: ["wed-2026-11-11-creative-ai-masterclass-2", false] },
  "unrelated-buyer": { id: 1109, email: "unrelated-buyer@rehearsal.invalid", name: "Rehearsal Unrelated Buyer", order: ["wed-2026-10-28-vr-cinematics", false] },
  "refunded-class": { id: 1110, email: "refunded-class@rehearsal.invalid", name: "Rehearsal Refunded Buyer", order: ["wed-2026-11-04-creative-ai-masterclass-1", true] },
  "separate-participant": { id: 1111, email: "participant@rehearsal.invalid", name: "Rehearsal Separate Participant", membership: ["starter", "active", "2027-12-31T23:59:59Z"] },
});

function parseArgs(argv) {
  const args = [...argv];
  const command = args[0]?.startsWith("-") ? "start" : (args.shift() ?? "start");
  const options = { port: 8771, reset: false, r2: false, artifact: undefined, allowHosts: [], fixture: undefined };
  while (args.length) {
    const arg = args.shift();
    if (arg === "--reset") options.reset = true;
    else if (arg === "--r2") options.r2 = true;
    else if (arg === "--artifact") options.artifact = path.resolve(String(args.shift() ?? ""));
    else if (arg === "--port") options.port = Number(args.shift());
    else if (arg === "--allow-host") options.allowHosts.push(String(args.shift() ?? ""));
    else if (!options.fixture) options.fixture = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) {
    throw new Error("--port must be an integer from 1024 through 65535");
  }
  if (options.port === 65535) throw new Error("--port 65535 leaves no port for the owned Next child");
  if (options.r2 && options.artifact) throw new Error("Use either --r2 or --artifact, not both");
  return { command, options };
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function hmac(value) {
  return crypto.createHmac("sha256", authSecret).update(value).digest("hex");
}

function postgresArray(values) {
  return `{${values.map((value) => {
    if (value === null) return "NULL";
    const text = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${text}"`;
  }).join(",")}}`;
}

function rawValue(value, dataTypeID) {
  if (value === null || value === undefined) return null;
  if (dataTypeID === 16) return value ? "t" : "f";
  if (dataTypeID === 17 && value instanceof Uint8Array) return `\\x${Buffer.from(value).toString("hex")}`;
  if (dataTypeID === 1082 && value instanceof Date) return value.toISOString().slice(0, 10);
  if (value instanceof Date) {
    const iso = value.toISOString();
    // The Neon client parses PostgreSQL's text representation for temporal
    // OIDs. Keep the ISO precision, but use the space-delimited PostgreSQL
    // wire form so timestamptz values do not parse as null/Unix epoch.
    if (dataTypeID === 1114) return iso.replace("T", " ").replace("Z", "");
    if (dataTypeID === 1184) return iso.replace("T", " ").replace("Z", "+00");
    return iso;
  }
  if ((dataTypeID === 114 || dataTypeID === 3802) && typeof value !== "string") return JSON.stringify(value);
  if (Array.isArray(value)) return postgresArray(value);
  return String(value);
}

function neonResult(result) {
  const fields = result.fields ?? [];
  return {
    command: result.command ?? "",
    fields,
    rowCount: result.rowCount ?? result.rows?.length ?? result.affectedRows ?? 0,
    rows: (result.rows ?? []).map((row) => row.map((value, index) => rawValue(value, fields[index]?.dataTypeID))),
  };
}

function errorBody(error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    severity: error?.severity ?? "ERROR",
    code: error?.code,
    detail: error?.detail,
    hint: error?.hint,
    position: error?.position,
    schema: error?.schema,
    table: error?.table,
    column: error?.column,
    constraint: error?.constraint,
  };
}

async function executeNeonRequest(db, request) {
  const body = await request.json();
  const run = async (executor, query) => neonResult(await executor.query(query.query, query.params ?? [], { rowMode: "array" }));
  try {
    if (Array.isArray(body.queries)) {
      const results = await db.transaction(async (tx) => {
        const output = [];
        for (const query of body.queries) output.push(await run(tx, query));
        return output;
      });
      return json({ results });
    }
    if (typeof body.query !== "string" || !Array.isArray(body.params)) return json({ message: "Malformed Neon query payload" }, 400);
    return json(await run(db, body));
  } catch (error) {
    return json(errorBody(error), 400);
  }
}

async function ensureHarnessSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY, brand TEXT NOT NULL DEFAULT 'acp', email TEXT NOT NULL,
      name TEXT, stripe_customer_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (brand, email)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY, brand TEXT NOT NULL DEFAULT 'acp', customer_id BIGINT NOT NULL REFERENCES customers(id),
      sku TEXT NOT NULL, stripe_session_id TEXT UNIQUE, stripe_payment_intent_id TEXT,
      stripe_event_id TEXT UNIQUE, amount_cents INTEGER, status TEXT NOT NULL DEFAULT 'paid',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      id BIGSERIAL PRIMARY KEY, customer_id BIGINT NOT NULL REFERENCES customers(id), sku TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'indie', status TEXT NOT NULL DEFAULT 'active', source_order_id BIGINT REFERENCES orders(id),
      major_version INTEGER NOT NULL DEFAULT 1, updates_until TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at TIMESTAMPTZ, welcomed_at TIMESTAMPTZ, grant_source TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS entitlements_one_membership_per_customer
      ON entitlements (customer_id) WHERE sku = 'membership';
    CREATE TABLE IF NOT EXISTS magic_links (
      id BIGSERIAL PRIMARY KEY, customer_id BIGINT NOT NULL REFERENCES customers(id), token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY, customer_id BIGINT NOT NULL REFERENCES customers(id), token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS catalog_orders (
      id BIGSERIAL PRIMARY KEY, stripe_session_id TEXT UNIQUE NOT NULL, payment_intent_id TEXT, slug TEXT,
      email TEXT, name TEXT, amount_cents INTEGER, refunded BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), note TEXT
    );
  `);
}

async function seedFixtures(db) {
  await ensureHarnessSchema(db);
  for (const [key, fixture] of Object.entries(fixtures)) {
    await db.query(
      `INSERT INTO customers (id, brand, email, name) VALUES ($1, 'acp', $2, $3)
       ON CONFLICT (brand, email) DO UPDATE SET name = EXCLUDED.name`,
      [fixture.id, fixture.email, fixture.name]
    );
    if (fixture.membership) {
      const [tier, status, updatesUntil] = fixture.membership;
      await db.query(
        `INSERT INTO entitlements (customer_id, sku, tier, status, updates_until, revoked_at)
         VALUES ($1, 'membership', $2, $3, $4, CASE WHEN $3 = 'revoked' THEN now() ELSE NULL END)
         ON CONFLICT (customer_id) WHERE sku = 'membership'
         DO UPDATE SET tier = EXCLUDED.tier, status = EXCLUDED.status, updates_until = EXCLUDED.updates_until,
           revoked_at = EXCLUDED.revoked_at`,
        [fixture.id, tier, status, updatesUntil]
      );
    }
    if (fixture.order) {
      const [slug, refunded] = fixture.order;
      await db.query(
        `INSERT INTO catalog_orders
           (stripe_session_id, payment_intent_id, slug, email, name, amount_cents, refunded)
         VALUES ($1, $2, $3, $4, $5, 10000, $6)
         ON CONFLICT (stripe_session_id) DO UPDATE SET refunded = EXCLUDED.refunded`,
        [`rehearsal-${key}`, `rehearsal-pi-${key}`, slug, fixture.email, fixture.name, refunded]
      );
    }
  }
  await db.exec("SELECT setval(pg_get_serial_sequence('customers', 'id'), GREATEST((SELECT max(id) FROM customers), 1));");
}

async function checkpoint(db) {
  const tableRows = await db.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  const counts = {};
  for (const { tablename } of tableRows.rows) {
    if (!/^[a-z_][a-z0-9_]*$/.test(tablename)) continue;
    const result = await db.query(`SELECT count(*)::int AS count FROM "${tablename}"`);
    counts[tablename] = result.rows[0]?.count ?? 0;
  }
  return counts;
}

async function feedbackStatus(db) {
  const hasTables = await db.query(`
    SELECT count(*)::int AS count FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'second_brain_feedback'
  `);
  if (hasTables.rows[0]?.count !== 1) return [];
  const rows = await db.query(`
    SELECT c.customer_id, c.enabled, c.notice_version, c.withdrawn_at,
           f.submission_id, f.release_id, f.recorded_at
    FROM second_brain_feedback_consents c
    LEFT JOIN second_brain_research_identities r ON r.customer_id = c.customer_id
    LEFT JOIN second_brain_feedback f ON f.research_id = r.research_id
    ORDER BY c.customer_id, f.recorded_at
  `);
  const fixtureById = new Map(Object.entries(fixtures).map(([key, value]) => [value.id, key]));
  return rows.rows.map((row) => ({ ...row, fixture: fixtureById.get(Number(row.customer_id)) ?? null }));
}

async function expireFeedback(db, fixtureKey) {
  const fixture = fixtures[fixtureKey];
  if (!fixture) throw new Error(`Unknown fixture: ${fixtureKey}`);
  const result = await db.query(`
    UPDATE second_brain_feedback f
    SET recorded_at = now() - interval '91 days'
    FROM second_brain_research_identities r
    WHERE f.research_id = r.research_id AND r.customer_id = $1
    RETURNING f.id
  `, [fixture.id]);
  return { fixture: fixtureKey, expiredRows: result.rows.length };
}

async function issueLink(db, fixtureKey, baseUrl) {
  const fixture = fixtures[fixtureKey];
  if (!fixture) throw new Error(`Unknown fixture: ${fixtureKey}`);
  const token = `rehearsal-link-${fixtureKey}-${crypto.randomBytes(12).toString("base64url")}`;
  await db.query(
    "INSERT INTO magic_links (customer_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 minutes')",
    [fixture.id, hmac(token)]
  );
  return { fixture: fixtureKey, email: fixture.email, url: `${baseUrl}/api/account/verify?token=${token}` };
}

async function issueSession(db, fixtureKey) {
  const fixture = fixtures[fixtureKey];
  if (!fixture) throw new Error(`Unknown fixture: ${fixtureKey}`);
  const token = `rehearsal-session-${fixtureKey}-${crypto.randomBytes(12).toString("base64url")}`;
  await db.query(
    "INSERT INTO sessions (customer_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 days')",
    [fixture.id, hmac(token)]
  );
  return { fixture: fixtureKey, email: fixture.email, cookie: `acp_session=${token}` };
}

async function captureEmail(request, mails) {
  let payload;
  try { payload = JSON.parse(await request.text()); } catch { payload = { malformed: true }; }
  const recipients = [payload.to, payload.cc, payload.bcc].flat().filter(Boolean).flat();
  const fixture = Object.entries(fixtures).find(([, value]) => recipients.some((recipient) => String(recipient).toLowerCase() === value.email))?.[0] ?? null;
  const text = typeof payload.text === "string" ? payload.text : "";
  const magicLink = text.match(/https?:\/\/[^\s]+\/api\/account\/verify\?token=[^\s]+/)?.[0] ?? null;
  const mail = { id: `rehearsal-mail-${mails.length + 1}`, fixture, capturedAt: new Date().toISOString(), magicLink, payload };
  mails.push(mail);
  return json({ id: mail.id });
}

async function readState() {
  return JSON.parse(await readFile(stateFile, "utf8"));
}

async function controlRequest(command, fixture) {
  const state = await readState().catch(() => null);
  if (!state) throw new Error(`No running rehearsal found at ${stateFile}`);
  const method = ["restart", "stop", "link", "session", "expire-feedback"].includes(command) ? "POST" : "GET";
  const route = command === "mail" ? "mail" : command;
  const url = new URL(`/control/${route}`, state.proxyOrigin);
  if (fixture) url.searchParams.set("fixture", fixture);
  const response = await fetch(url, { method, headers: { "x-rehearsal-control-token": state.controlToken } });
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${body}`);
  process.stdout.write(`${body}\n`);
  if (command === "stop") {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const currentState = await readState().catch(() => null);
      if (!currentState) return;
      try {
        process.kill(state.harnessPid, 0);
      } catch (error) {
        if (error?.code === "ESRCH") return;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Harness PID ${state.harnessPid} did not stop within 10 seconds`);
  }
}

async function ensureIgnored() {
  const gitDir = (await new Promise((resolve, reject) => {
    const child = spawn("git", ["rev-parse", "--git-path", "info/exclude"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(output.trim()) : reject(new Error("Unable to resolve git exclude file")));
  }));
  const absolute = path.resolve(root, gitDir);
  const current = await readFile(absolute, "utf8").catch(() => "");
  if (!current.split(/\r?\n/).includes("/.rehearsal/")) await appendFile(absolute, `${current.endsWith("\n") || !current ? "" : "\n"}/.rehearsal/\n`);
}

async function startHarness(options) {
  await ensureIgnored();
  const existing = await readState().catch(() => null);
  if (existing?.harnessPid) {
    try {
      process.kill(existing.harnessPid, 0);
      throw new Error(`A rehearsal harness is already running as PID ${existing.harnessPid}`);
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
      await rm(stateFile, { force: true });
    }
  }
  if (options.reset) await rm(databaseDir, { recursive: true, force: true });
  await mkdir(databaseDir, { recursive: true });
  if (options.artifact) {
    const artifact = await readFile(options.artifact).catch(() => null);
    if (!artifact) throw new Error(`Artifact is not readable: ${options.artifact}`);
  }
  const db = new PGlite(databaseDir);
  await db.waitReady;
  await seedFixtures(db);

  const mails = [];
  const controlToken = crypto.randomBytes(24).toString("base64url");
  let nextChild = null;
  let nextStartedAt = null;
  let nextExit = null;
  let stopping = false;
  let proxyOrigin;
  const baseUrl = `http://localhost:${options.port}`;
  const nextPort = options.port + 1;
  const artifactToken = crypto.randomBytes(24).toString("base64url");

  const envFileKeys = new Set();
  for (const filename of [".env.local", ".env.development.local", ".env.development", ".env"]) {
    const contents = await readFile(path.join(root, filename), "utf8").catch(() => "");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) envFileKeys.add(match[1]);
    }
  }

  function childEnvironment() {
    const environment = {
      ...Object.fromEntries([...envFileKeys].map((key) => [key, "rehearsal-disabled"])),
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      LANG: process.env.LANG,
      TERM: process.env.TERM,
      NODE_ENV: "development",
      NODE_OPTIONS: `--import=${preloadFile}`,
      DATABASE_URL: databaseUrl,
      AUTH_SECRET: authSecret,
      CRON_SECRET: cronSecret,
      RESEND_API_KEY: "rehearsal_resend_key",
      NEXT_PUBLIC_SITE_URL: baseUrl,
      NEXT_PUBLIC_MEMBERSHIP_LIVE: "1",
      SECOND_BRAIN_REHEARSAL_PROXY_ORIGIN: proxyOrigin,
      SECOND_BRAIN_REHEARSAL_PROXY_TOKEN: controlToken,
      SECOND_BRAIN_REHEARSAL_ALLOW_HOSTS: options.allowHosts.join(","),
      ZOOM_ACCOUNT_ID: "rehearsal-disabled",
      ZOOM_CLIENT_ID: "rehearsal-disabled",
      ZOOM_CLIENT_SECRET: "rehearsal-disabled",
    };
    if (options.artifact) {
      environment.R2_ACCOUNT_ID = "rehearsal-fixture";
      environment.R2_ACCESS_KEY_ID = "rehearsal-fixture-access";
      environment.R2_SECRET_ACCESS_KEY = "rehearsal-fixture-secret";
      environment.R2_BUCKET = "rehearsal-fixture";
    }
    if (options.r2) {
      for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
        if (process.env[name]) environment[name] = process.env[name];
      }
      if (process.env.R2_ACCOUNT_ID) {
        environment.SECOND_BRAIN_REHEARSAL_ALLOW_HOSTS = [
          environment.SECOND_BRAIN_REHEARSAL_ALLOW_HOSTS,
          `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        ].filter(Boolean).join(",");
      }
    }
    return Object.fromEntries(Object.entries(environment).filter(([, value]) => value !== undefined));
  }

  function startNext() {
    if (nextChild) throw new Error("Next server is already running");
    const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
    nextExit = null;
    nextStartedAt = new Date().toISOString();
    nextChild = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(nextPort)], {
      cwd: root,
      env: childEnvironment(),
      stdio: "inherit",
    });
    const ownedChild = nextChild;
    ownedChild.once("exit", (code, signal) => {
      if (nextChild === ownedChild) nextChild = null;
      nextExit = { code, signal, at: new Date().toISOString() };
    });
  }

  async function stopNext() {
    if (!nextChild) return;
    const ownedChild = nextChild;
    ownedChild.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => ownedChild.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    if (ownedChild.exitCode === null && ownedChild.signalCode === null) ownedChild.kill("SIGKILL");
    if (nextChild === ownedChild) nextChild = null;
  }

  async function waitForNextReady() {
    let lastError;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (!nextChild) throw new Error(`Next server exited before becoming ready: ${JSON.stringify(nextExit)}`);
      try {
        const response = await fetch(`http://127.0.0.1:${nextPort}/account`, {
          redirect: "manual",
          signal: AbortSignal.timeout(1000),
        });
        if (response.status > 0) return;
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Next server did not become ready on port ${nextPort}: ${lastError}`);
  }

  const server = http.createServer(async (incoming, outgoing) => {
    const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
      method: incoming.method,
      headers: incoming.headers,
      body: incoming.method === "GET" || incoming.method === "HEAD" ? undefined : incoming,
      duplex: incoming.method === "GET" || incoming.method === "HEAD" ? undefined : "half",
    });
    let response;
    try {
      const url = new URL(request.url);
      if (url.pathname === "/neon" || url.pathname === "/capture-email") {
        if (request.headers.get("x-rehearsal-proxy-token") !== controlToken) response = json({ error: "Unauthorized" }, 401);
        else if (url.pathname === "/neon") response = await executeNeonRequest(db, request);
        else response = await captureEmail(request, mails);
      } else if (url.pathname.startsWith("/control/")) {
        if (request.headers.get("x-rehearsal-control-token") !== controlToken) response = json({ error: "Unauthorized" }, 401);
        else {
          const action = url.pathname.slice("/control/".length);
          const fixtureKey = url.searchParams.get("fixture");
          if (action === "status") response = json({ ok: true, harnessPid: process.pid, proxyOrigin, baseUrl, next: { pid: nextChild?.pid ?? null, port: nextPort, startedAt: nextStartedAt, lastExit: nextExit }, databaseDir, artifact: options.artifact ? path.basename(options.artifact) : null, mailCount: mails.length });
          else if (action === "fixtures") response = json(Object.fromEntries(Object.entries(fixtures).map(([key, value]) => [key, { id: value.id, email: value.email }])));
          else if (action === "checkpoint") response = json({ counts: await checkpoint(db), mailCount: mails.length });
          else if (action === "feedback") response = json(await feedbackStatus(db));
          else if (action === "expire-feedback" && request.method === "POST") response = json(await expireFeedback(db, fixtureKey));
          else if (action === "mail") response = json(
            mails
              .filter((mail) => !fixtureKey || mail.fixture === fixtureKey)
              .map((mail) => ({
                id: mail.id,
                fixture: mail.fixture,
                capturedAt: mail.capturedAt,
                subject: mail.payload?.subject ?? null,
                magicLink: mail.magicLink,
              }))
          );
          else if (action === "link" && request.method === "POST") response = json(await issueLink(db, fixtureKey, baseUrl));
          else if (action === "session" && request.method === "POST") response = json(await issueSession(db, fixtureKey));
          else if (action === "restart" && request.method === "POST") {
            await stopNext(); startNext(); await waitForNextReady(); response = json({ ok: true, nextPid: nextChild.pid });
          } else if (action === "stop" && request.method === "POST") {
            response = json({ ok: true }); setTimeout(() => shutdown(0), 25);
          } else response = json({ error: "Unknown control action" }, 404);
        }
      } else if (url.pathname === "/artifact/second-brain-kit" && options.artifact && url.searchParams.get("token") === artifactToken) {
        const body = await readFile(options.artifact);
        response = new Response(body, {
          headers: {
            "content-type": "application/zip",
            "content-disposition": `attachment; filename="${path.basename(options.artifact)}"`,
            "cache-control": "private, no-store",
          },
        });
      } else response = json({ error: "Not found" }, 404);
    } catch (error) {
      response = json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const proxyPort = server.address().port;
  proxyOrigin = `http://127.0.0.1:${proxyPort}`;

  const publicServer = http.createServer((incoming, outgoing) => {
    const publicUrl = new URL(incoming.url ?? "/", baseUrl);
    if (incoming.method === "GET" && publicUrl.pathname.startsWith("/rehearsal/mail/")) {
      const fixtureKey = decodeURIComponent(publicUrl.pathname.slice("/rehearsal/mail/".length));
      const fixture = fixtures[fixtureKey];
      const mail = [...mails].reverse().find((item) => item.fixture === fixtureKey);
      const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const body = fixture
        ? `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Rehearsal mail</title><main style="font:16px system-ui;max-width:680px;margin:48px auto;padding:24px"><p style="font-family:monospace;color:#087f75">LOCAL REHEARSAL INBOX</p><h1>${escape(fixtureKey)}</h1><p>${escape(fixture.email)}</p>${mail?.magicLink ? `<p><a id="magic-link" href="${escape(mail.magicLink)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#111;color:white">Open captured sign-in link</a></p><p>${escape(mail.subject ?? "")}</p>` : `<p>No captured message yet. Submit this fixture email through the real account login form, then reload.</p>`}</main>`
        : `<!doctype html><meta charset="utf-8"><main style="font:16px system-ui;max-width:680px;margin:48px auto"><h1>Unknown rehearsal fixture</h1></main>`;
      outgoing.writeHead(fixture ? 200 : 404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      outgoing.end(body);
      return;
    }
    const upstream = http.request({
      hostname: "127.0.0.1",
      port: nextPort,
      method: incoming.method,
      path: incoming.url,
      headers: incoming.headers,
    }, (upstreamResponse) => {
      const headers = { ...upstreamResponse.headers };
      const location = headers.location;
      if (options.artifact && location) {
        try {
          const destination = new URL(location);
          if (destination.hostname.endsWith(".r2.cloudflarestorage.com")) {
            headers.location = `${proxyOrigin}/artifact/second-brain-kit?token=${artifactToken}`;
            headers["x-rehearsal-r2-original"] = destination.origin;
          }
        } catch {}
      }
      outgoing.writeHead(upstreamResponse.statusCode ?? 502, headers);
      upstreamResponse.pipe(outgoing);
    });
    upstream.once("error", (error) => {
      if (!outgoing.headersSent) outgoing.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      outgoing.end(`Rehearsal Next proxy error: ${error.message}`);
    });
    incoming.pipe(upstream);
  });
  await new Promise((resolve, reject) => {
    publicServer.once("error", reject);
    publicServer.listen(options.port, "127.0.0.1", resolve);
  });

  async function shutdown(code) {
    if (stopping) return;
    stopping = true;
    await stopNext();
    await new Promise((resolve) => {
      publicServer.close(resolve);
      publicServer.closeAllConnections?.();
    });
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
    await db.close();
    await rm(stateFile, { force: true });
    process.exitCode = code;
  }

  process.once("SIGINT", () => shutdown(130));
  process.once("SIGTERM", () => shutdown(143));
  process.once("uncaughtException", (error) => { console.error(error); shutdown(1); });
  process.once("unhandledRejection", (error) => { console.error(error); shutdown(1); });

  startNext();
  await writeFile(stateFile, JSON.stringify({ harnessPid: process.pid, proxyOrigin, controlToken, baseUrl, port: options.port }, null, 2), { mode: 0o600 });
  await waitForNextReady();
  process.stdout.write(`${JSON.stringify({ ready: true, harnessPid: process.pid, nextPid: nextChild.pid, port: options.port, nextPort, baseUrl, proxyOrigin, databaseDir, artifact: options.artifact ? path.basename(options.artifact) : null, fixtures: Object.keys(fixtures) })}\n`);
}

const { command, options } = parseArgs(process.argv.slice(2));
if (command === "start") await startHarness(options);
else if (["status", "fixtures", "checkpoint", "feedback", "expire-feedback", "mail", "link", "session", "restart", "stop"].includes(command)) {
  await controlRequest(command, options.fixture);
} else {
  throw new Error("Usage: second-brain-rehearsal.mjs [start|status|fixtures|checkpoint|feedback|expire-feedback <fixture>|mail [fixture]|link <fixture>|session <fixture>|restart|stop] [--port 8771] [--reset] [--artifact .rehearsal/kit.zip | --r2] [--allow-host hostname]");
}
