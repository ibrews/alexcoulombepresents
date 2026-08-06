import { NextRequest, NextResponse } from "next/server";
import { islePortalToken } from "@/lib/islePortalAuth";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const password = formData.get("password");
  const expectedPassword = process.env.ISLE_PORTAL_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!expectedPassword || !authSecret) {
    return NextResponse.redirect(new URL("/lab/isle/gate?error=unavailable", req.url), 303);
  }
  if (typeof password !== "string" || password !== expectedPassword) {
    return NextResponse.redirect(new URL("/lab/isle/gate?error=invalid", req.url), 303);
  }

  const response = NextResponse.redirect(new URL("/lab/isle", req.url), 303);
  response.cookies.set("isle_portal", await islePortalToken(authSecret), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return response;
}
