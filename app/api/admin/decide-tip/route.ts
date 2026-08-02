import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { decideTip } from "@/lib/db";
import { markTipDecided } from "@/lib/telegram";

// Programmatic equivalent of tapping Approve/Reject in Telegram — for
// superseding a draft outside the normal review flow, e.g. a version-tag
// fix regenerated after the fact. Edits the original Telegram message to
// show the outcome, same as a real button tap would.
//
// POST body: { id: number, decision: "approved" | "rejected" }

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
  const id = Number(body?.id);
  const decision = body?.decision;
  if (!Number.isFinite(id) || (decision !== "approved" && decision !== "rejected")) {
    return NextResponse.json({ error: 'Body must be { id: number, decision: "approved" | "rejected" }' }, { status: 400 });
  }

  const tip = await decideTip(id, decision);
  if (!tip) {
    return NextResponse.json({ error: "No pending_approval tip with that id" }, { status: 404 });
  }

  if (tip.telegram_message_id) {
    await markTipDecided(tip.telegram_message_id, tip.text, decision);
  }

  return NextResponse.json({ id: tip.id, decision });
}
