import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { insertDraftTip, setTipTelegramMessageId } from "@/lib/db";
import { sendTipForApproval } from "@/lib/telegram";
import { X_ACCOUNT } from "@/lib/xApi";

// Batch-inserts draft tips and sends each to Telegram for approval. Callable
// by hand now (curl, see intelligence/decisions/2026-08-02-uetips-content-verification-required.md
// for why every draft here must already be fact-checked before it's posted
// here) — later by the automated local-fleet selection+validation job once
// Sam is back up. This route never judges content, only queues + notifies.
//
// POST body: { drafts: [{ text: string, source?: string }] }

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const drafts = body?.drafts;
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return NextResponse.json({ error: "Body must be { drafts: [{ text, source? }] }" }, { status: 400 });
  }

  const results: Record<string, unknown>[] = [];
  for (const draft of drafts) {
    const text = typeof draft?.text === "string" ? draft.text.trim() : "";
    if (!text) {
      results.push({ skipped: "empty text" });
      continue;
    }
    if (text.length > 280) {
      results.push({ skipped: `over 280 chars (${text.length})`, text });
      continue;
    }
    const source = typeof draft?.source === "string" ? draft.source : null;
    const row = await insertDraftTip({ account: X_ACCOUNT, text, source });
    const messageId = await sendTipForApproval({ text, source, queueId: row.id });
    await setTipTelegramMessageId(row.id, messageId);
    results.push({ id: row.id, sent: true });
  }

  return NextResponse.json({ queued: results.length, results });
}
