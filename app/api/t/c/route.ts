import { NextRequest, NextResponse } from "next/server";
import { recordEmailEvent, verifyClickSig } from "@/lib/tracking";

// Click-tracking redirect. The signature covers the DESTINATION URL too, so
// this can never be abused as an open redirect — only links our own send
// pipeline generated verify, and anything else bounces to the homepage.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  const e = req.nextUrl.searchParams.get("e");
  const u = req.nextUrl.searchParams.get("u");
  const s = req.nextUrl.searchParams.get("s") ?? "";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";

  if (!c || !e || !u || !verifyClickSig(c, e, u, s)) {
    return NextResponse.redirect(site);
  }

  recordEmailEvent({ campaign: c, email: e, type: "click", url: u }).catch(() => {});
  return NextResponse.redirect(u);
}
