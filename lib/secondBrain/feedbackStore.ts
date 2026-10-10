import crypto from "node:crypto";
import { ensureCommerceSchema, sql } from "../commerce/schema.ts";
import {
  canonicalFeedbackPayload,
  FEEDBACK_RETENTION_DAYS,
  type FeedbackPayload,
  type FeedbackRecord,
  type FeedbackSelfExport,
} from "./feedback.ts";

export type SubmitFeedbackResult = { accepted: true; duplicate: boolean };

export type FeedbackStore = {
  get(customerId: number): Promise<FeedbackSelfExport>;
  setConsent(customerId: number, enabled: boolean, consentVersion: string): Promise<FeedbackSelfExport>;
  submit(customerId: number, consentVersion: string, payload: FeedbackPayload): Promise<SubmitFeedbackResult>;
  withdraw(customerId: number): Promise<FeedbackSelfExport>;
};

export type FeedbackStoreErrorCode =
  | "consent_required"
  | "consent_version_mismatch"
  | "submission_id_conflict";

export class FeedbackStoreError extends Error {
  readonly code: FeedbackStoreErrorCode;

  constructor(code: FeedbackStoreErrorCode) {
    super(code);
    this.name = "FeedbackStoreError";
    this.code = code;
  }
}

let feedbackSchemaPromise: Promise<void> | null = null;

export async function ensureFeedbackSchema() {
  if (feedbackSchemaPromise) return feedbackSchemaPromise;
  feedbackSchemaPromise = (async () => {
    await ensureCommerceSchema();
    const db = sql();
    await db`
    CREATE TABLE IF NOT EXISTS second_brain_feedback_consents (
      customer_id    BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
      enabled        BOOLEAN NOT NULL DEFAULT false,
      notice_version TEXT NOT NULL,
      decided_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      withdrawn_at   TIMESTAMPTZ
    )
  `;
    await db`
    CREATE TABLE IF NOT EXISTS second_brain_research_identities (
      customer_id BIGINT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
      research_id UUID NOT NULL UNIQUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
    await db`
    CREATE TABLE IF NOT EXISTS second_brain_feedback (
      id              BIGSERIAL PRIMARY KEY,
      research_id     UUID NOT NULL REFERENCES second_brain_research_identities(research_id) ON DELETE CASCADE,
      submission_id   UUID NOT NULL,
      consent_version TEXT NOT NULL,
      release_id      TEXT NOT NULL,
      payload_hash    TEXT NOT NULL,
      payload         JSONB NOT NULL,
      recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (research_id, submission_id)
    )
  `;
    await db`
    CREATE INDEX IF NOT EXISTS second_brain_feedback_retention
      ON second_brain_feedback (recorded_at)
    `;
  })().catch((error) => {
    feedbackSchemaPromise = null;
    throw error;
  });
  return feedbackSchemaPromise;
}

type StoreOptions = {
  consentVersion: string;
  releaseId: string;
  now?: () => Date;
  randomUUID?: () => string;
};

function retentionCutoff(now: Date): string {
  return new Date(now.getTime() - FEEDBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function payloadHash(payload: FeedbackPayload): string {
  return crypto.createHash("sha256").update(canonicalFeedbackPayload(payload)).digest("hex");
}

type ConsentRow = { enabled: boolean; notice_version: string };
type FeedbackRow = { payload: FeedbackPayload; release_id: string; recorded_at: string | Date };

function selfExport(consentRows: ConsentRow[], feedbackRows: FeedbackRow[]): FeedbackSelfExport {
  const consent = consentRows[0];
  return {
    consent: {
      enabled: consent?.enabled === true,
      version: consent?.enabled ? consent.notice_version : null,
    },
    feedback: feedbackRows.map((row) => ({
      ...row.payload,
      releaseId: row.release_id,
      recordedAt: new Date(row.recorded_at).toISOString(),
    })),
  };
}

export async function purgeExpiredFeedback(
  at: Date = new Date()
): Promise<{ feedbackDeleted: number; identitiesDeleted: number }> {
  await ensureFeedbackSchema();
  const db = sql();
  const [feedbackRows, identityRows] = await db.transaction(
    (tx) => [
      tx`
        DELETE FROM second_brain_feedback
        WHERE recorded_at < ${retentionCutoff(at)}
        RETURNING id
      `,
      tx`
        DELETE FROM second_brain_research_identities r
        WHERE NOT EXISTS (
          SELECT 1 FROM second_brain_feedback_consents c
          WHERE c.customer_id = r.customer_id AND c.enabled = true
        )
        RETURNING research_id
      `,
    ],
    { isolationLevel: "Serializable" }
  );
  return {
    feedbackDeleted: (feedbackRows as unknown[]).length,
    identitiesDeleted: (identityRows as unknown[]).length,
  };
}

export function createPostgresFeedbackStore(options: StoreOptions): FeedbackStore {
  const now = options.now ?? (() => new Date());
  const randomUUID = options.randomUUID ?? crypto.randomUUID;

  async function get(customerId: number): Promise<FeedbackSelfExport> {
    await ensureFeedbackSchema();
    const db = sql();
    const [_, consentRows, feedbackRows] = await db.transaction(
      (tx) => [
        tx`DELETE FROM second_brain_feedback WHERE recorded_at < ${retentionCutoff(now())}`,
        tx`
          SELECT enabled, notice_version
          FROM second_brain_feedback_consents
          WHERE customer_id = ${customerId}
        `,
        tx`
          SELECT f.payload, f.release_id, f.recorded_at
          FROM second_brain_feedback f
          JOIN second_brain_research_identities r ON r.research_id = f.research_id
          WHERE r.customer_id = ${customerId}
          ORDER BY f.recorded_at ASC, f.id ASC
        `,
      ],
      { isolationLevel: "Serializable" }
    );
    return selfExport(consentRows as ConsentRow[], feedbackRows as FeedbackRow[]);
  }

  async function withdraw(customerId: number, noticeVersion = options.consentVersion): Promise<FeedbackSelfExport> {
    await ensureFeedbackSchema();
    const db = sql();
    await db.transaction(
      (tx) => [
        tx`DELETE FROM second_brain_feedback WHERE recorded_at < ${retentionCutoff(now())}`,
        tx`
          INSERT INTO second_brain_feedback_consents
            (customer_id, enabled, notice_version, decided_at, withdrawn_at)
          VALUES (${customerId}, false, ${noticeVersion}, now(), now())
          ON CONFLICT (customer_id) DO UPDATE SET
            enabled = false,
            notice_version = EXCLUDED.notice_version,
            decided_at = now(),
            withdrawn_at = now()
        `,
        tx`DELETE FROM second_brain_research_identities WHERE customer_id = ${customerId}`,
      ],
      { isolationLevel: "Serializable" }
    );
    return { consent: { enabled: false, version: null }, feedback: [] };
  }

  async function setConsent(
    customerId: number,
    enabled: boolean,
    consentVersion: string
  ): Promise<FeedbackSelfExport> {
    if (consentVersion !== options.consentVersion) {
      throw new FeedbackStoreError("consent_version_mismatch");
    }
    if (!enabled) return withdraw(customerId, consentVersion);
    await ensureFeedbackSchema();
    const db = sql();
    const researchId = randomUUID();
    await db.transaction(
      (tx) => [
        tx`DELETE FROM second_brain_feedback WHERE recorded_at < ${retentionCutoff(now())}`,
        tx`
          INSERT INTO second_brain_feedback_consents
            (customer_id, enabled, notice_version, decided_at, withdrawn_at)
          VALUES (${customerId}, true, ${consentVersion}, now(), NULL)
          ON CONFLICT (customer_id) DO UPDATE SET
            enabled = true,
            notice_version = EXCLUDED.notice_version,
            decided_at = now(),
            withdrawn_at = NULL
        `,
        tx`
          INSERT INTO second_brain_research_identities (customer_id, research_id)
          VALUES (${customerId}, ${researchId})
          ON CONFLICT (customer_id) DO NOTHING
        `,
      ],
      { isolationLevel: "Serializable" }
    );
    return get(customerId);
  }

  async function submit(
    customerId: number,
    consentVersion: string,
    payload: FeedbackPayload
  ): Promise<SubmitFeedbackResult> {
    if (consentVersion !== options.consentVersion) {
      throw new FeedbackStoreError("consent_version_mismatch");
    }
    await ensureFeedbackSchema();
    const db = sql();
    const hash = payloadHash(payload);
    const encodedPayload = canonicalFeedbackPayload(payload);
    const [_, consentRows, existingRows, insertedRows] = await db.transaction(
      (tx) => [
        tx`DELETE FROM second_brain_feedback WHERE recorded_at < ${retentionCutoff(now())}`,
        tx`
          SELECT enabled, notice_version
          FROM second_brain_feedback_consents
          WHERE customer_id = ${customerId}
          FOR UPDATE
        `,
        tx`
          SELECT f.payload_hash
          FROM second_brain_feedback f
          JOIN second_brain_research_identities r ON r.research_id = f.research_id
          WHERE r.customer_id = ${customerId} AND f.submission_id = ${payload.submissionId}
        `,
        tx`
          INSERT INTO second_brain_feedback
            (research_id, submission_id, consent_version, release_id, payload_hash, payload, recorded_at)
          SELECT r.research_id, ${payload.submissionId}, ${consentVersion}, ${options.releaseId},
                 ${hash}, ${encodedPayload}::jsonb, now()
          FROM second_brain_research_identities r
          JOIN second_brain_feedback_consents c ON c.customer_id = r.customer_id
          WHERE r.customer_id = ${customerId}
            AND c.enabled = true
            AND c.notice_version = ${consentVersion}
          ON CONFLICT (research_id, submission_id) DO NOTHING
          RETURNING id
        `,
      ],
      { isolationLevel: "ReadCommitted" }
    );

    const consent = (consentRows as ConsentRow[])[0];
    if (!consent?.enabled || consent.notice_version !== consentVersion) {
      throw new FeedbackStoreError("consent_required");
    }
    const existing = (existingRows as { payload_hash: string }[])[0];
    if (existing) {
      if (existing.payload_hash !== hash) throw new FeedbackStoreError("submission_id_conflict");
      return { accepted: true, duplicate: true };
    }
    if ((insertedRows as unknown[]).length !== 1) {
      throw new FeedbackStoreError("submission_id_conflict");
    }
    return { accepted: true, duplicate: false };
  }

  return { get, setConsent, submit, withdraw: (customerId) => withdraw(customerId) };
}

type MemoryParticipant = {
  enabled: boolean;
  noticeVersion: string;
  researchId: string | null;
  feedback: Array<{ hash: string; record: FeedbackRecord }>;
};

export function createInMemoryFeedbackStore(options: StoreOptions): FeedbackStore {
  const now = options.now ?? (() => new Date());
  const randomUUID = options.randomUUID ?? crypto.randomUUID;
  const participants = new Map<number, MemoryParticipant>();

  function participant(customerId: number): MemoryParticipant {
    let current = participants.get(customerId);
    if (!current) {
      current = { enabled: false, noticeVersion: options.consentVersion, researchId: null, feedback: [] };
      participants.set(customerId, current);
    }
    const cutoff = Date.parse(retentionCutoff(now()));
    current.feedback = current.feedback.filter(({ record }) => Date.parse(record.recordedAt) >= cutoff);
    return current;
  }

  function exportParticipant(current: MemoryParticipant): FeedbackSelfExport {
    return {
      consent: { enabled: current.enabled, version: current.enabled ? current.noticeVersion : null },
      feedback: current.feedback.map(({ record }) => structuredClone(record)),
    };
  }

  return {
    async get(customerId) {
      return exportParticipant(participant(customerId));
    },
    async setConsent(customerId, enabled, consentVersion) {
      const current = participant(customerId);
      current.enabled = enabled;
      current.noticeVersion = consentVersion;
      if (enabled) current.researchId ??= randomUUID();
      else {
        current.researchId = null;
        current.feedback = [];
      }
      return exportParticipant(current);
    },
    async submit(customerId, consentVersion, payload) {
      const current = participant(customerId);
      if (!current.enabled || current.noticeVersion !== consentVersion || !current.researchId) {
        throw new FeedbackStoreError("consent_required");
      }
      const hash = payloadHash(payload);
      const existing = current.feedback.find(({ record }) => record.submissionId === payload.submissionId);
      if (existing) {
        if (existing.hash !== hash) throw new FeedbackStoreError("submission_id_conflict");
        return { accepted: true, duplicate: true };
      }
      current.feedback.push({
        hash,
        record: { ...structuredClone(payload), releaseId: options.releaseId, recordedAt: now().toISOString() },
      });
      return { accepted: true, duplicate: false };
    },
    async withdraw(customerId) {
      const current = participant(customerId);
      current.enabled = false;
      current.noticeVersion = options.consentVersion;
      current.researchId = null;
      current.feedback = [];
      return exportParticipant(current);
    },
  };
}
