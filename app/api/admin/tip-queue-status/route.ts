import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { listTips } from "@/lib/db";
import { X_ACCOUNT } from "@/lib/xApi";

// Read-only ground truth for the tip queue — what's actually pending,
// approved, rejected, or posted, straight from Postgres.

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tips = await listTips(X_ACCOUNT);
  return NextResponse.json({ tips });
}
