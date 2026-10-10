import crypto from "node:crypto";
import { purgeExpiredFeedback } from "@/lib/secondBrain/feedbackStore";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = crypto.createHash("sha256").update(`Bearer ${secret ?? ""}`).digest();
  const supplied = crypto.createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  const headers = { "Cache-Control": "private, no-store" };
  if (!secret || !crypto.timingSafeEqual(expected, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try { return Response.json(await purgeExpiredFeedback(), { headers }); }
  catch { return Response.json({ error: "Cleanup unavailable" }, { status: 503, headers }); }
}
