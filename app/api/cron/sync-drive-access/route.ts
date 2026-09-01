import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { classFolders } from "@/lib/classMaterials";
import { extractDriveFolderId, shareDriveFolder } from "@/lib/commerce/driveAccess";
import {
  syncDriveAccess,
  type DriveAccessFolder,
  type DriveAccessSyncDeps,
} from "@/lib/commerce/driveAccessSync";
import { activeMembersForLicensing } from "@/lib/commerce/entitlements";
import { allNonRefundedOrderEmails } from "@/lib/commerce/seats";

// Higher than the other crons here (30s): this one makes one Drive API call
// per (member × folder) grant, sequentially — dozens of round-trips even at
// today's small member/class count. Confirmed live 2026-08-31 that 30s
// wasn't enough headroom even after fixing the real cause (a token refetched
// per grant instead of cached — see driveAccess.ts).
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = crypto.createHash("sha256").update(header).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function driveFolders(): DriveAccessFolder[] {
  const folders: DriveAccessFolder[] = [];
  for (const folder of classFolders) {
    const material = folder.materials.find(
      (candidate) => candidate.key === "folder" && candidate.source.kind === "external"
    );
    if (!material || material.source.kind !== "external") continue;
    const folderId = extractDriveFolderId(material.source.url);
    if (folderId) folders.push({ slug: folder.slug, folderId });
  }
  return folders;
}

function driveAccessSyncDeps(): DriveAccessSyncDeps {
  return {
    activeMembers: activeMembersForLicensing,
    buyers: allNonRefundedOrderEmails,
    shareDriveFolder,
  };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ ok: true, skipped: "no GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY configured" });
  }

  try {
    const summary = await syncDriveAccess(driveFolders(), driveAccessSyncDeps());
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[sync-drive-access] sync failed", err);
    return NextResponse.json({ ok: false, error: "Drive access sync failed" }, { status: 500 });
  }
}
