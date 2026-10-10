import assert from "node:assert/strict";
import test from "node:test";
import {
  FEEDBACK_CONSENT_VERSION,
  parseFeedbackPostAction,
  type FeedbackPayload,
} from "../lib/secondBrain/feedback.ts";
import { createFeedbackRouteHandlers } from "../lib/secondBrain/feedbackRoutes.ts";
import { createInMemoryFeedbackStore } from "../lib/secondBrain/feedbackStore.ts";

const SITE = "https://alexcoulombepresents.com";
const SUBMISSION_ID = "10000000-0000-4000-8000-000000000001";
const ATTEMPT_ID = "20000000-0000-4000-8000-000000000002";

function payload(overrides: Partial<FeedbackPayload> = {}): FeedbackPayload {
  return {
    submissionId: SUBMISSION_ID,
    eventType: "workflow_outcome",
    attemptId: ATTEMPT_ID,
    workflowId: "SB-01",
    stepId: "verify",
    environment: "macos",
    outcome: "independent",
    assistance: "guide-assistant",
    durationBucket: "30-60m",
    ...overrides,
  };
}

function fixture() {
  let current = new Date("2026-10-10T12:00:00.000Z");
  let eligible = true;
  let member = true;
  let signedIn = true;
  let rateLimit = true;
  const store = createInMemoryFeedbackStore({
    consentVersion: FEEDBACK_CONSENT_VERSION,
    releaseId: "0.1.0-alpha.1",
    now: () => current,
    randomUUID: () => "30000000-0000-4000-8000-000000000003",
  });
  const handlers = createFeedbackRouteHandlers({
    store,
    consentVersion: FEEDBACK_CONSENT_VERSION,
    allowedOrigins: [SITE],
    getCustomerId: async () => (signedIn ? 42 : null),
    getAccess: async () => ({ allowed: eligible, member }),
    rateLimitAllows: async () => rateLimit,
  });
  function request(method: string, body?: unknown, options: { origin?: string; json?: boolean } = {}) {
    const headers = new Headers();
    if (options.origin !== undefined) headers.set("origin", options.origin);
    if (options.json !== false && body !== undefined) headers.set("content-type", "application/json");
    return new Request(`${SITE}/api/second-brain/feedback`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  return {
    handlers,
    request,
    store,
    setEligible(value: boolean) {
      eligible = value;
    },
    setMember(value: boolean) {
      member = value;
    },
    setSignedIn(value: boolean) {
      signedIn = value;
    },
    setRateLimit(value: boolean) {
      rateLimit = value;
    },
    setNow(value: string) {
      current = new Date(value);
    },
  };
}

async function body(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("payload parser accepts only the bounded structured contract", () => {
  const action = parseFeedbackPostAction({
    action: "submit",
    consentVersion: FEEDBACK_CONSENT_VERSION,
    payload: payload(),
  });
  assert.equal(action.action, "submit");

  assert.throws(
    () =>
      parseFeedbackPostAction({
        action: "submit",
        consentVersion: FEEDBACK_CONSENT_VERSION,
        payload: { ...payload(), comments: "a path, transcript, or other free text" },
      }),
    /Unexpected feedback field/
  );
  assert.throws(
    () =>
      parseFeedbackPostAction({
        action: "submit",
        consentVersion: FEEDBACK_CONSENT_VERSION,
        payload: { ...payload(), workflowId: "private-client-project" },
      }),
    /Unsupported feedback choice/
  );
  assert.throws(
    () =>
      parseFeedbackPostAction({
        action: "consent",
        enabled: true,
        consentVersion: FEEDBACK_CONSENT_VERSION,
        extra: true,
      }),
    /Unexpected feedback field/
  );
});

test("feedback starts off and GET requires only a valid session", async () => {
  const f = fixture();
  f.setEligible(false);
  const response = await f.handlers.GET(f.request("GET"));
  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), { consent: { enabled: false, version: null }, feedback: [] });

  f.setSignedIn(false);
  const unauthenticated = await f.handlers.GET(f.request("GET"));
  assert.equal(unauthenticated.status, 401);
});

test("POST requires same origin, JSON, current member access, and current notice", async () => {
  const f = fixture();
  const consent = { action: "consent", enabled: true, consentVersion: FEEDBACK_CONSENT_VERSION };

  assert.equal((await f.handlers.POST(f.request("POST", consent))).status, 403);
  assert.equal(
    (await f.handlers.POST(f.request("POST", consent, { origin: SITE, json: false }))).status,
    415
  );

  f.setEligible(false);
  assert.equal((await f.handlers.POST(f.request("POST", consent, { origin: SITE }))).status, 403);
  f.setEligible(true);
  const stale = await f.handlers.POST(
    f.request("POST", { ...consent, consentVersion: "old-notice" }, { origin: SITE })
  );
  assert.equal(stale.status, 409);
});

test("explicit consent enables a bounded submission and self export", async () => {
  const f = fixture();
  f.setMember(false); // An eligible November class purchaser can volunteer too.
  const enabled = await f.handlers.POST(
    f.request(
      "POST",
      { action: "consent", enabled: true, consentVersion: FEEDBACK_CONSENT_VERSION },
      { origin: SITE }
    )
  );
  assert.equal(enabled.status, 200);
  assert.deepEqual(await body(enabled), {
    consent: { enabled: true, version: FEEDBACK_CONSENT_VERSION },
    feedback: [],
  });

  const submitted = await f.handlers.POST(
    f.request(
      "POST",
      { action: "submit", consentVersion: FEEDBACK_CONSENT_VERSION, payload: payload() },
      { origin: SITE }
    )
  );
  assert.equal(submitted.status, 201);
  assert.deepEqual(await body(submitted), { accepted: true, duplicate: false });

  const exported = await body(await f.handlers.GET(f.request("GET")));
  assert.deepEqual(exported, {
    consent: { enabled: true, version: FEEDBACK_CONSENT_VERSION },
    feedback: [
      {
        ...payload(),
        releaseId: "0.1.0-alpha.1",
        recordedAt: "2026-10-10T12:00:00.000Z",
      },
    ],
  });
  assert.equal(JSON.stringify(exported).includes("research"), false);
  assert.equal(JSON.stringify(exported).includes("customer"), false);
});

test("submission IDs deduplicate identical retries and reject changed retries", async () => {
  const f = fixture();
  await f.store.setConsent(42, true, FEEDBACK_CONSENT_VERSION);
  const submit = (value: FeedbackPayload) =>
    f.handlers.POST(
      f.request(
        "POST",
        { action: "submit", consentVersion: FEEDBACK_CONSENT_VERSION, payload: value },
        { origin: SITE }
      )
    );

  assert.equal((await submit(payload())).status, 201);
  const retry = await submit(payload());
  assert.equal(retry.status, 200);
  assert.deepEqual(await body(retry), { accepted: true, duplicate: true });
  const mismatch = await submit(payload({ outcome: "blocked", reasonCode: "tool-error" }));
  assert.equal(mismatch.status, 409);
  assert.equal((await f.store.get(42)).feedback.length, 1);
});

test("withdrawal remains available without entitlement and erases prior feedback", async () => {
  const f = fixture();
  await f.store.setConsent(42, true, FEEDBACK_CONSENT_VERSION);
  await f.store.submit(42, FEEDBACK_CONSENT_VERSION, payload());
  f.setEligible(false);

  const withdrawn = await f.handlers.DELETE(f.request("DELETE", undefined, { origin: SITE }));
  assert.equal(withdrawn.status, 200);
  assert.deepEqual(await body(withdrawn), { consent: { enabled: false, version: null }, feedback: [] });

  await assert.rejects(
    f.store.submit(
      42,
      FEEDBACK_CONSENT_VERSION,
      payload({ submissionId: "40000000-0000-4000-8000-000000000004" })
    ),
    /consent_required/
  );
});

test("an explicit No thanks remains available without entitlement", async () => {
  const f = fixture();
  f.setEligible(false);
  const declined = await f.handlers.POST(
    f.request(
      "POST",
      { action: "consent", enabled: false, consentVersion: FEEDBACK_CONSENT_VERSION },
      { origin: SITE }
    )
  );
  assert.equal(declined.status, 200);
  assert.deepEqual(await body(declined), { consent: { enabled: false, version: null }, feedback: [] });
});

test("submission is rate limited but decline and withdrawal stay available", async () => {
  const f = fixture();
  await f.store.setConsent(42, true, FEEDBACK_CONSENT_VERSION);
  f.setRateLimit(false);

  const submitted = await f.handlers.POST(
    f.request(
      "POST",
      { action: "submit", consentVersion: FEEDBACK_CONSENT_VERSION, payload: payload() },
      { origin: SITE }
    )
  );
  assert.equal(submitted.status, 429);

  const declined = await f.handlers.POST(
    f.request(
      "POST",
      { action: "consent", enabled: false, consentVersion: FEEDBACK_CONSENT_VERSION },
      { origin: SITE }
    )
  );
  assert.equal(declined.status, 200);
  assert.equal((await f.handlers.DELETE(f.request("DELETE", undefined, { origin: SITE }))).status, 200);
});

test("retention pruning removes records older than 90 days on read", async () => {
  const f = fixture();
  await f.store.setConsent(42, true, FEEDBACK_CONSENT_VERSION);
  await f.store.submit(42, FEEDBACK_CONSENT_VERSION, payload());
  f.setNow("2027-01-08T12:00:00.000Z");
  assert.equal((await f.store.get(42)).feedback.length, 1, "record is retained at exactly 90 days");
  f.setNow("2027-01-08T12:00:00.001Z");
  const exported = await f.store.get(42);
  assert.equal(exported.consent.enabled, true);
  assert.deepEqual(exported.feedback, []);
});
