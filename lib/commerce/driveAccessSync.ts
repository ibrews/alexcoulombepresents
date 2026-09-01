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
  // Skips a pair entirely (no API call, doesn't count toward the summary) —
  // this is the real fix for the rate-limit problem below, not the batching.
  alreadyGranted(folderId: string, email: string): Promise<boolean>;
  recordGrant(folderId: string, email: string): Promise<void>;
  shareDriveFolder(folderId: string, email: string): Promise<boolean>;
};

export type DriveAccessSyncSummary = {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number; // already granted in a prior run — no API call made
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

  return runGrants(grants, deps);
}

// Google's Drive sharing endpoint enforces its own tight rate limit,
// separate from general API quota (confirmed live 2026-08-31: even 2
// concurrent grants with full exponential backoff still failed 10 of 15 real
// calls over 5+ minutes — the quota window is clearly minutes, not seconds,
// so no realistic in-request retry bridges it). The actual fix is
// `alreadyGranted`/`recordGrant`: without them, every daily run re-attempted
// every existing (member × folder) pair from scratch, which is what
// generated enough call volume to trip the limit in the first place.
// Steady-state daily volume is now just that day's genuinely new grants —
// small enough that low concurrency here is about safety margin, not speed.
const GRANT_CONCURRENCY = 2;

async function runGrants(
  grants: { folderId: string; email: string }[],
  deps: Pick<DriveAccessSyncDeps, "alreadyGranted" | "recordGrant" | "shareDriveFolder">
): Promise<DriveAccessSyncSummary> {
  const summary: DriveAccessSyncSummary = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  for (let i = 0; i < grants.length; i += GRANT_CONCURRENCY) {
    const batch = grants.slice(i, i + GRANT_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (grant): Promise<"skipped" | "succeeded" | "failed"> => {
        try {
          if (await deps.alreadyGranted(grant.folderId, grant.email)) return "skipped";
          const shared = await deps.shareDriveFolder(grant.folderId, grant.email);
          if (!shared) return "failed";
          await deps.recordGrant(grant.folderId, grant.email);
          return "succeeded";
        } catch (err) {
          console.error(
            `[drive-access-sync] grant failed for folder ${grant.folderId}, email ${grant.email}:`,
            err
          );
          return "failed";
        }
      })
    );
    for (const result of results) {
      if (result === "skipped") {
        summary.skipped += 1;
        continue;
      }
      summary.attempted += 1;
      if (result === "succeeded") summary.succeeded += 1;
      else summary.failed += 1;
    }
  }
  return summary;
}
