import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { customerFromSession } from "@/lib/commerce/tokens";
import { isMember } from "@/lib/commerce/membership";
import { findMaterial, MATERIALS_DIR } from "@/lib/materials";

// Gated class materials: session cookie → active membership → stream the file
// out of content/materials/. Deliberately not in public/ — a file under
// public/ is served by the CDN with no auth, which would make the deck a
// members' perk in name only.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const material = findMaterial(key);
  if (!material) return NextResponse.json({ error: "Unknown material" }, { status: 404 });

  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  if (!customerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const member = await isMember(customerId).catch(() => false);
  if (!member) return NextResponse.json({ error: "Members only" }, { status: 403 });

  const body = await readFile(path.join(MATERIALS_DIR, material.file));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": material.contentType,
      "Content-Disposition": `attachment; filename="${material.downloadAs}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
