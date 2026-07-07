import { NextRequest, NextResponse } from "next/server";
import { redeemMagicLink } from "@/lib/commerce/tokens";

// Redeems a magic-link token (from the fulfillment email or a login
// request), sets an httpOnly session cookie, and redirects to /account.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  if (!token) return NextResponse.redirect(`${site}/account?error=missing_token`);

  const sessionToken = await redeemMagicLink(token);
  if (!sessionToken) return NextResponse.redirect(`${site}/account?error=invalid_or_expired`);

  const res = NextResponse.redirect(`${site}/account`);
  res.cookies.set("acp_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
