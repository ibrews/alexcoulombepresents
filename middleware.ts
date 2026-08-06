import { NextRequest, NextResponse } from "next/server";
import { islePortalToken, islePortalTokensMatch } from "@/lib/islePortalAuth";

// CORS for /api/checkout only, so a product's own marketing site (e.g.
// drainspotting.app) can POST straight to checkout instead of round-tripping
// through the store page first. Allowlisted origins only — this endpoint
// creates real Stripe Checkout sessions, so no wildcard.
const ALLOWED_ORIGINS = new Set([
  "https://drainspotting.app",
]);

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isIslePortal = pathname === "/lab/isle" || pathname.startsWith("/lab/isle/");
  const isGate = pathname === "/lab/isle/gate";

  if (isIslePortal && !isGate) {
    const secret = process.env.AUTH_SECRET;
    const cookie = req.cookies.get("isle_portal")?.value;
    const expectedToken = secret ? await islePortalToken(secret) : "";

    if (!cookie || !expectedToken || !islePortalTokensMatch(cookie, expectedToken)) {
      return NextResponse.redirect(new URL("/lab/isle/gate", req.url));
    }
  }

  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ["/api/checkout", "/lab/isle", "/lab/isle/:path*"],
};
