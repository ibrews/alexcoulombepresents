import { NextRequest, NextResponse } from "next/server";

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

export function middleware(req: NextRequest) {
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
  matcher: "/api/checkout",
};
