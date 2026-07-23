import { NextRequest, NextResponse } from "next/server";
import { PIXEL_GIF, recordEmailEvent, verifyOpenSig } from "@/lib/tracking";

// Open-tracking pixel. Always returns the GIF — a broken or forged request
// just records nothing. Signed (HMAC of campaign+email) so junk can't be
// stuffed into the stats.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  const e = req.nextUrl.searchParams.get("e");
  const s = req.nextUrl.searchParams.get("s") ?? "";

  if (c && e && verifyOpenSig(c, e, s)) {
    // Fire-and-forget — the pixel response must not wait on the DB.
    recordEmailEvent({ campaign: c, email: e, type: "open" }).catch(() => {});
  }

  return new NextResponse(PIXEL_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
