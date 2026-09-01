// ── Class-materials Drive access sync — pure decision logic ────────────────
// Active members receive every Drive-backed class folder; individual buyers
// receive only the folder whose slug they bought. All database and Drive API
// work arrives through `deps`, keeping the grant calculation unit-testable
// without either service.

export type DriveAccessMember = { email: string };
export type DriveAccessFolder = { slug: string; folderId: string };
export type DriveAccessBuyer = { email: string; slug: string };

export type DriveAccessSyncDeps = {
  activeMembers(): Promise<DriveAccessMember[]>;
  buyers(): Promise<DriveAccessBuyer[]>;
  shareDriveFolder(folderId: string, email: string): Promise<boolean>;
};

export type DriveAccessSyncSummary = {
  attempted: number;
  succeeded: number;
  failed: number;
};

export async function syncDriveAccess(
  folders: DriveAccessFolder[],
  deps: DriveAccessSyncDeps
): Promise<DriveAccessSyncSummary> {
  const [members, buyers] = await Promise.all([deps.activeMembers(), deps.buyers()]);
  const folderBySlug = new Map(folders.map((folder) => [folder.slug, folder.folderId]));
  const grants: { folderId: string; email: string }[] = [];
  const seen = new Set<string>();

  function addGrant(folderId: string, email: string) {
    const key = `${folderId}\0${email.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    grants.push({ folderId, email });
  }

  for (const member of members) {
    for (const folder of folders) addGrant(folder.folderId, member.email);
  }
  for (const buyer of buyers) {
    const folderId = folderBySlug.get(buyer.slug);
    if (folderId) addGrant(folderId, buyer.email);
  }

  const summary: DriveAccessSyncSummary = { attempted: 0, succeeded: 0, failed: 0 };
  for (const grant of grants) {
    summary.attempted += 1;
    try {
      const shared = await deps.shareDriveFolder(grant.folderId, grant.email);
      if (shared) summary.succeeded += 1;
      else summary.failed += 1;
    } catch (err) {
      console.error(
        `[drive-access-sync] grant failed for folder ${grant.folderId}, email ${grant.email}:`,
        err
      );
      summary.failed += 1;
    }
  }
  return summary;
}
