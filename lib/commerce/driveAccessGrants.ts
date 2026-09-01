// ── Drive-access-grant memory ────────────────────────────────────────────
// Tracks which (folder, email) reader grants have already succeeded, so the
// daily sync (lib/commerce/driveAccessSync.ts) only ever attempts NEW
// grants — see schema.ts's drive_access_grants comment for why this exists:
// re-attempting every existing grant every day is what tripped Google's
// Drive sharing rate limit, not the concurrency level.

import { sql, ensureCommerceSchema } from "./schema";

export async function alreadyGrantedDriveAccess(folderId: string, email: string): Promise<boolean> {
  await ensureCommerceSchema();
  const rows = (await sql()`
    SELECT id FROM drive_access_grants WHERE folder_id = ${folderId} AND lower(email) = lower(${email})
  `) as { id: number }[];
  return rows.length > 0;
}

// ON CONFLICT DO NOTHING rather than a pre-check: two concurrent grant
// batches recording the same pair is a harmless no-op either way, and this
// avoids a second round trip on the common case.
export async function recordDriveAccessGrant(folderId: string, email: string): Promise<void> {
  await ensureCommerceSchema();
  // Stored lowercased so the UNIQUE constraint actually catches a repeat
  // grant regardless of the casing a future call passes — the read above is
  // case-insensitive already, but a mixed-case duplicate row would otherwise
  // slip past the DB-level constraint even though the read-check would still
  // (correctly) treat it as already-granted.
  await sql()`
    INSERT INTO drive_access_grants (folder_id, email) VALUES (${folderId}, lower(${email}))
    ON CONFLICT (folder_id, email) DO NOTHING
  `;
}
