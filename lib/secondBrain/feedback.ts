export const FEEDBACK_CONSENT_VERSION = "2026-10-10.v1" as const;
export const FEEDBACK_RETENTION_DAYS = 90 as const;

export const FEEDBACK_WORKFLOW_IDS = ["SB-01", "JOB-01", "QA-01"] as const;
export const FEEDBACK_STEP_IDS = ["setup", "retrieve", "part-1", "restart", "part-2", "verify"] as const;
export const FEEDBACK_EVENT_TYPES = ["workflow_outcome"] as const;
export const FEEDBACK_OUTCOMES = [
  "independent",
  "with-help",
  "blocked",
  "abandoned",
  "unknown",
] as const;
export const FEEDBACK_ASSISTANCE = ["none", "guide-assistant", "peer", "acp-support"] as const;
export const FEEDBACK_ENVIRONMENTS = ["windows", "macos", "linux", "other", "unknown"] as const;
export const FEEDBACK_REASON_CODES = [
  "setup",
  "access-license",
  "missing-reference",
  "wrong-version",
  "unclear-step",
  "tool-error",
  "hardware-unavailable",
  "other-unknown",
] as const;
export const FEEDBACK_DURATION_BUCKETS = [
  "under-15m",
  "15-30m",
  "30-60m",
  "1-2h",
  "over-2h",
  "unknown",
] as const;

export type FeedbackWorkflowId = (typeof FEEDBACK_WORKFLOW_IDS)[number];
export type FeedbackStepId = (typeof FEEDBACK_STEP_IDS)[number];
export type FeedbackEventType = (typeof FEEDBACK_EVENT_TYPES)[number];
export type FeedbackOutcome = (typeof FEEDBACK_OUTCOMES)[number];
export type FeedbackAssistance = (typeof FEEDBACK_ASSISTANCE)[number];
export type FeedbackEnvironment = (typeof FEEDBACK_ENVIRONMENTS)[number];
export type FeedbackReasonCode = (typeof FEEDBACK_REASON_CODES)[number];
export type FeedbackDurationBucket = (typeof FEEDBACK_DURATION_BUCKETS)[number];

export type FeedbackPayload = {
  submissionId: string;
  eventType: FeedbackEventType;
  attemptId: string;
  workflowId: FeedbackWorkflowId;
  stepId?: FeedbackStepId;
  environment?: FeedbackEnvironment;
  outcome: FeedbackOutcome;
  reasonCode?: FeedbackReasonCode;
  assistance: FeedbackAssistance;
  durationBucket?: FeedbackDurationBucket;
};

export type FeedbackRecord = FeedbackPayload & {
  releaseId: string;
  recordedAt: string;
};

export type FeedbackSelfExport = {
  consent: { enabled: boolean; version: string | null };
  feedback: FeedbackRecord[];
};

export type FeedbackPostAction =
  | {
      action: "consent";
      enabled: boolean;
      consentVersion: string;
    }
  | {
      action: "submit";
      consentVersion: string;
      payload: FeedbackPayload;
    };

export class FeedbackValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackValidationError";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function objectWithExactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = []
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FeedbackValidationError("Expected a JSON object.");
  }
  const record = value as Record<string, unknown>;
  const permitted = new Set([...required, ...optional]);
  if (Object.keys(record).some((key) => !permitted.has(key))) {
    throw new FeedbackValidationError("Unexpected feedback field.");
  }
  if (required.some((key) => !(key in record))) {
    throw new FeedbackValidationError("Missing required feedback field.");
  }
  return record;
}

function enumValue<T extends string>(value: unknown, choices: readonly T[]): T {
  if (typeof value !== "string" || !choices.includes(value as T)) {
    throw new FeedbackValidationError("Unsupported feedback choice.");
  }
  return value as T;
}

function optionalEnumValue<T extends string>(value: unknown, choices: readonly T[]): T | undefined {
  return value === undefined ? undefined : enumValue(value, choices);
}

function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new FeedbackValidationError("Feedback IDs must be UUIDs.");
  }
  return value;
}

export function parseFeedbackPayload(value: unknown): FeedbackPayload {
  const payload = objectWithExactKeys(
    value,
    ["submissionId", "eventType", "attemptId", "workflowId", "outcome", "assistance"],
    ["stepId", "environment", "reasonCode", "durationBucket"]
  );
  return {
    submissionId: uuid(payload.submissionId),
    eventType: enumValue(payload.eventType, FEEDBACK_EVENT_TYPES),
    attemptId: uuid(payload.attemptId),
    workflowId: enumValue(payload.workflowId, FEEDBACK_WORKFLOW_IDS),
    stepId: optionalEnumValue(payload.stepId, FEEDBACK_STEP_IDS),
    environment: optionalEnumValue(payload.environment, FEEDBACK_ENVIRONMENTS),
    outcome: enumValue(payload.outcome, FEEDBACK_OUTCOMES),
    reasonCode: optionalEnumValue(payload.reasonCode, FEEDBACK_REASON_CODES),
    assistance: enumValue(payload.assistance, FEEDBACK_ASSISTANCE),
    durationBucket: optionalEnumValue(payload.durationBucket, FEEDBACK_DURATION_BUCKETS),
  };
}

export function parseFeedbackPostAction(value: unknown): FeedbackPostAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FeedbackValidationError("Expected a JSON object.");
  }
  const outer = value as Record<string, unknown>;
  if (outer.action === "consent") {
    const consent = objectWithExactKeys(value, ["action", "enabled", "consentVersion"]);
    if (typeof consent.enabled !== "boolean" || typeof consent.consentVersion !== "string") {
      throw new FeedbackValidationError("Invalid consent choice.");
    }
    return {
      action: "consent",
      enabled: consent.enabled,
      consentVersion: consent.consentVersion,
    };
  }
  if (outer.action === "submit") {
    const submission = objectWithExactKeys(value, ["action", "consentVersion", "payload"]);
    if (typeof submission.consentVersion !== "string") {
      throw new FeedbackValidationError("Invalid consent version.");
    }
    return {
      action: "submit",
      consentVersion: submission.consentVersion,
      payload: parseFeedbackPayload(submission.payload),
    };
  }
  throw new FeedbackValidationError("Unsupported feedback action.");
}

export function canonicalFeedbackPayload(payload: FeedbackPayload): string {
  return JSON.stringify(payload);
}
