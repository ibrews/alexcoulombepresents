import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/commerce/tokens";

// Signs the customer out: deletes the session row (server-side revocation)
// and clears the cookie. Plain-form friendly — redirects back to /account.
export async function POST(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  try {
    await destroySession(req.cookies.get("acp_session")?.value);
  } catch (err) {
    // Clearing the cookie still signs this browser out; log and continue.
    console.error("[logout] session delete failed", err);
  }
  const res = NextResponse.redirect(`${site}/account`, 303);
  res.cookies.set("acp_session", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
