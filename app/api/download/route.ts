import { NextRequest, NextResponse } from "next/server";
import { customerFromSession } from "@/lib/commerce/tokens";
import { entitlementsForCustomer } from "@/lib/commerce/entitlements";
import { findDigitalProduct } from "@/lib/commerce/products";
import { presignDownloadUrl } from "@/lib/commerce/r2";

// Gated download: session cookie → active entitlement for the requested sku
// → short-lived R2 presigned URL → 302. The storefront never links R2
// objects directly.
export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku");
  if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 });

  const sessionToken = req.cookies.get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken);
  if (!customerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const entitlements = await entitlementsForCustomer(customerId);
  const entitlement = entitlements.find((e) => e.sku === sku && e.status === "active");
  if (!entitlement) return NextResponse.json({ error: "No active entitlement for this product" }, { status: 403 });

  const product = findDigitalProduct(sku);
  if (!product) return NextResponse.json({ error: "Unknown product" }, { status: 404 });

  const url = await presignDownloadUrl(product.r2Prefix);
  return NextResponse.redirect(url);
}
