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

  return runGrants(grants, deps.shareDriveFolder);
}

// Drive's permissions.create endpoint runs ~2s per call regardless of token
// caching (confirmed live 2026-08-31 — not an artifact of this client, the
// endpoint itself is just slow) — sequential grants blew the cron's time
// budget well before the member/folder count gets large enough to matter on
// its own (35 grants × ~2s ≈ 70s, over even a 60s budget). Batches run
// concurrently instead; kept small and fixed rather than unbounded so a
// large future member list can't slam Drive's per-second rate limit.
// Batching (not a work-stealing pool) keeps this deterministic to test:
// `Promise.all(batch.map(...))` starts every call in the batch before any of
// them can resolve, and preserves result order — the same shape a plain
// sequential loop had, just with each item's network wait overlapped.
const GRANT_CONCURRENCY = 6;

async function runGrants(
  grants: { folderId: string; email: string }[],
  shareDriveFolder: DriveAccessSyncDeps["shareDriveFolder"]
): Promise<DriveAccessSyncSummary> {
  const summary: DriveAccessSyncSummary = { attempted: 0, succeeded: 0, failed: 0 };
  for (let i = 0; i < grants.length; i += GRANT_CONCURRENCY) {
    const batch = grants.slice(i, i + GRANT_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (grant) => {
        try {
          return await shareDriveFolder(grant.folderId, grant.email);
        } catch (err) {
          console.error(
            `[drive-access-sync] grant failed for folder ${grant.folderId}, email ${grant.email}:`,
            err
          );
          return false;
        }
      })
    );
    for (const shared of results) {
      summary.attempted += 1;
      if (shared) summary.succeeded += 1;
      else summary.failed += 1;
    }
  }
  return summary;
}
