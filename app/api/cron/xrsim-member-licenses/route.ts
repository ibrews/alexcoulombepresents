import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { refreshMemberLicenses, type MemberLicensingDeps } from "@/lib/commerce/memberLicensing";
import { activeMembersForLicensing, grantOrRefreshMemberLicense } from "@/lib/commerce/entitlements";
import { findDigitalProduct } from "@/lib/commerce/products";

// Daily refresh of every active member's free xrsim license (see
// lib/commerce/memberLicensing.ts for the design — why this re-issues a
// fresh, short-lived key rather than pushing a live revocation). Same
// schedule slot as the site's other daily crons (vercel.json).

export const maxDuration = 30;

const XRSIM_SKU = "xrsim";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function memberLicensingDeps(): MemberLicensingDeps {
  return {
    activeMembers: activeMembersForLicensing,
    grantOrRefreshMemberLicense,
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = findDigitalProduct(XRSIM_SKU);
  if (!product) {
    console.error(`[xrsim-member-licenses] "${XRSIM_SKU}" is not in the digital product catalog`);
    return NextResponse.json({ ok: false, error: "product not found" }, { status: 500 });
  }

  try {
    const refreshed = await refreshMemberLicenses(XRSIM_SKU, product.majorVersion, memberLicensingDeps());
    return NextResponse.json({ ok: true, sku: XRSIM_SKU, refreshed: refreshed.length });
  } catch (err) {
    console.error("[xrsim-member-licenses] refresh failed", err);
    return NextResponse.json({ ok: false, error: "refresh failed" }, { status: 500 });
  }
}
