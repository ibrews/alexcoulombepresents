import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { requirePluginLicenseSecret, verifyPluginLicense } from "@/lib/commerce/pluginLicensing";
import { PLUGIN_UPDATES } from "@/lib/commerce/pluginUpdates";

// Verifies a UE plugin's own HMAC-signed license file (the plugin sends the
// fields it already has — not a separate auth token) and reports whether
// it's entitled. See lib/commerce/pluginLicensing.ts for the format, the
// signature algorithm, and the anti-enumeration contract this route depends
// on: verifyPluginLicense returns the IDENTICAL `{ entitled: false }` shape
// for a bad signature, a well-formed-but-nonexistent license, an expired
// license, or malformed input — this route must never add distinguishing
// detail on top of that.
//
// No CORS here on purpose: a UE plugin's HTTP client isn't a browser and
// doesn't send/enforce an Origin header the way the class-deck poll GETs
// needed CORS for — there is no cross-origin problem to solve, so adding
// permissive CORS headers would only widen this POST's exposure for no
// benefit (see /api/vote and /api/training-survey, which open up CORS only
// on their GET tallies, never their POST).
export async function POST(req: NextRequest) {
  if (!(await rateLimitAllows(`plugin-entitlement:${clientIp(req)}`, 10, 60))) {
    return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }

  let secret: string;
  try {
    secret = requirePluginLicenseSecret();
  } catch (err) {
    // Fail closed: never fall through and treat every license as valid just
    // because the secret isn't configured yet.
    console.error("[plugin-entitlement] ACP_PLUGIN_LICENSE_SECRET is not set", err);
    return NextResponse.json({ error: "Entitlement service not configured" }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const result = verifyPluginLicense(body, secret);

  if (!result.entitled) {
    // Anti-enumeration: same generic shape whether the signature was wrong,
    // the license was well-formed but never issued, it expired, or the body
    // was malformed. Do not add a reason field here.
    return NextResponse.json({ entitled: false });
  }

  const manifestEntry = PLUGIN_UPDATES[result.product];

  return NextResponse.json({
    entitled: true,
    tier: result.tier,
    expiry: result.expiry,
    latest_version: manifestEntry?.latest ?? null,
    // Follow-up: a real signed-URL download system. Never fabricate a URL here.
    download_url: null,
  });
}
