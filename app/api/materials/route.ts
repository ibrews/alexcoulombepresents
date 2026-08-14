import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { customerFromSession } from "@/lib/commerce/tokens";
import { accessForCustomer, canOpen } from "@/lib/commerce/materialAccess";
import { findMaterial, materialAvailable } from "@/lib/classMaterials";
import { presignDownloadUrl } from "@/lib/commerce/r2";

// Gated class-material delivery. One route for all three source kinds so the
// access check happens in exactly one place:
//
//   local    → stream the file out of content/materials/ (never public/,
//              which the CDN serves with no auth at all)
//   r2       → 302 to a short-lived presigned URL, same as /api/download
//   external → 302 to the upstream link, gated on OUR side
//
export const runtime = "nodejs";

const MATERIALS_DIR = path.join(process.cwd(), "content", "materials");

export async function GET(req: NextRequest) {
  const folderSlug = req.nextUrl.searchParams.get("class");
  const key = req.nextUrl.searchParams.get("key");
  if (!folderSlug || !key) {
    return NextResponse.json({ error: "Missing class or key" }, { status: 400 });
  }

  const found = findMaterial(folderSlug, key);
  if (!found) return NextResponse.json({ error: "Unknown material" }, { status: 404 });
  const { folder, material } = found;

  const sessionToken = req.cookies.get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  if (!customerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const access = await accessForCustomer(customerId);
  if (!canOpen(folder, access)) {
    return NextResponse.json(
      {
        error: folder.membersOnly
          ? "This folder is a membership benefit."
          : `Your account doesn't have access to ${folder.title}.`,
      },
      { status: 403 }
    );
  }

  if (!materialAvailable(material)) {
    // R2 isn't configured (or the object isn't uploaded yet). Say so plainly
    // rather than surfacing a credentials stack trace to a paying customer.
    return NextResponse.json(
      { error: `${material.label} isn't available for download yet.` },
      { status: 503 }
    );
  }

  switch (material.source.kind) {
    case "local": {
      // Resolve and confirm containment before reading. The key comes from a
      // fixed registry, not the URL, so traversal isn't reachable today —
      // but a future entry with a "../" in it should fail closed here rather
      // than serve an arbitrary file.
      const full = path.resolve(MATERIALS_DIR, material.source.file);
      if (full !== path.normalize(full) || !full.startsWith(MATERIALS_DIR + path.sep)) {
        return NextResponse.json({ error: "Invalid material path" }, { status: 500 });
      }
      const body = await readFile(full);
      return new NextResponse(new Uint8Array(body), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${path.basename(material.source.file)}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    case "r2": {
      const url = await presignDownloadUrl(material.source.key);
      return NextResponse.redirect(url);
    }
    case "external":
      return NextResponse.redirect(material.source.url);
  }
}
