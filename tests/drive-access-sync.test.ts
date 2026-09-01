// ── Class-materials Drive access sync tests ────────────────────────────────
// The decision module receives fake members, buyers, and Drive calls, so no
// database or network is involved.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { extractDriveFolderId } from "../lib/commerce/driveAccess.ts";
import {
  syncDriveAccess,
  type DriveAccessBuyer,
  type DriveAccessFolder,
  type DriveAccessMember,
  type DriveAccessSyncDeps,
} from "../lib/commerce/driveAccessSync.ts";

type ShareCall = { folderId: string; email: string };

function fakeDeps(
  members: DriveAccessMember[] = [],
  buyers: DriveAccessBuyer[] = [],
  overrides: Partial<DriveAccessSyncDeps> = {}
) {
  const shareCalls: ShareCall[] = [];
  const deps: DriveAccessSyncDeps = {
    activeMembers: async () => members,
    buyers: async () => buyers,
    shareDriveFolder: async (folderId, email) => {
      shareCalls.push({ folderId, email });
      return true;
    },
    ...overrides,
  };
  return { deps, shareCalls };
}

const folders: DriveAccessFolder[] = [
  { slug: "class-a", folderId: "folder-a" },
  { slug: "class-b", folderId: "folder-b" },
];

test("a member gets a grant for every Drive folder", async () => {
  const { deps, shareCalls } = fakeDeps([{ email: "member@example.com" }]);
  await syncDriveAccess(folders, deps);
  assert.deepEqual(shareCalls, [
    { folderId: "folder-a", email: "member@example.com" },
    { folderId: "folder-b", email: "member@example.com" },
  ]);
});

test("a buyer gets only the folder for the slug they bought", async () => {
  const { deps, shareCalls } = fakeDeps([], [{ email: "buyer@example.com", slug: "class-b" }]);
  await syncDriveAccess(folders, deps);
  assert.deepEqual(shareCalls, [{ folderId: "folder-b", email: "buyer@example.com" }]);
});

test("a buyer whose slug has no Drive folder is skipped", async () => {
  const { deps, shareCalls } = fakeDeps([], [{ email: "buyer@example.com", slug: "class-c" }]);
  const summary = await syncDriveAccess(folders, deps);
  assert.deepEqual(shareCalls, []);
  assert.deepEqual(summary, { attempted: 0, succeeded: 0, failed: 0 });
});

test("a failed grant does not stop later grants", async () => {
  const shareCalls: ShareCall[] = [];
  const { deps } = fakeDeps([{ email: "member@example.com" }], [], {
    shareDriveFolder: async (folderId, email) => {
      shareCalls.push({ folderId, email });
      return folderId !== "folder-a";
    },
  });
  await syncDriveAccess(folders, deps);
  assert.deepEqual(shareCalls, [
    { folderId: "folder-a", email: "member@example.com" },
    { folderId: "folder-b", email: "member@example.com" },
  ]);
});

test("the summary counts attempted, successful, and failed grants", async () => {
  const { deps } = fakeDeps(
    [{ email: "member@example.com" }],
    [{ email: "buyer@example.com", slug: "class-a" }],
    { shareDriveFolder: async (folderId) => folderId !== "folder-b" }
  );
  const summary = await syncDriveAccess(folders, deps);
  assert.deepEqual(summary, { attempted: 3, succeeded: 2, failed: 1 });
});

test("extractDriveFolderId returns the ID from a Drive folder URL", () => {
  assert.equal(
    extractDriveFolderId("https://drive.google.com/drive/folders/1Abc_DEF-234?usp=sharing"),
    "1Abc_DEF-234"
  );
});

test("extractDriveFolderId rejects a Dropbox URL", () => {
  assert.equal(extractDriveFolderId("https://www.dropbox.com/s/example/folder"), null);
});

test("extractDriveFolderId rejects a non-folder Drive URL", () => {
  assert.equal(extractDriveFolderId("https://drive.google.com/file/d/1Abc_DEF-234/view"), null);
});
