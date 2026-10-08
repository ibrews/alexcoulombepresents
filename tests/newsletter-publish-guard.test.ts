import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

// ── Why this guard exists ────────────────────────────────────────────────────
// lib/newsletters.ts publishes EVERY .md in content/newsletters/ to the public
// archive at /newsletter. There is no draft state: `git add` IS the publish
// button. An in-progress draft committed by reflex — or swept up by a
// `git add -A` in a shared checkout — goes public on the next deploy, with no
// review step and no warning.
//
// The 2026-10-08 overnight run had to hold two drafts untracked all night and
// put "do NOT commit anything under content/newsletters/" in its handoff packet
// to keep that from happening. This test turns that tribal knowledge into a
// gate: a committed issue must declare its send state.
//
// Tracked files only, deliberately. Untracked drafts in a working tree are the
// SUPPORTED way to write an issue, so reading the directory would fail for
// exactly the people doing it right.

const REPO = process.cwd();
const DIR = "content/newsletters";

function trackedIssues(): string[] {
  try {
    return execFileSync("git", ["ls-files", DIR], { cwd: REPO, encoding: "utf8" })
      .split("\n").filter((f) => f.endsWith(".md"));
  } catch {
    return [];  // no git (tarball/CI without history) — nothing to assert
  }
}

function frontmatter(file: string): Record<string, string> {
  const raw = readFileSync(path.join(REPO, file), "utf8");
  const [header] = raw.split(/^---$/m);
  const out: Record<string, string> = {};
  for (const line of header.split("\n")) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

// Issues committed before this guard existed that do not satisfy it. Each needs
// a real answer, not a permanent exemption — do not add to this list to make a
// failure go away. Adding a line here means "this is publicly archived and we
// know it was never sent", which is a thing to decide, not to suppress.
const LEGACY_UNSENT = new Map([
  [
    "content/newsletters/2026-08-09-aug5-recording-and-next-class.md",
    "Committed (hence publicly archived at /newsletter) with neither sendAt nor sentAt — " +
      "archived without ever having been sent. Found 2026-10-08; open question for Alex: " +
      "was it sent outside the system, or should it come off the public archive?",
  ],
]);

test("every committed newsletter declares its send state", () => {
  const offenders: string[] = [];
  for (const file of trackedIssues()) {
    if (LEGACY_UNSENT.has(file)) continue;
    const fm = frontmatter(file);
    if (!fm.sendAt && !fm.sentAt) offenders.push(file);
  }
  assert.deepEqual(
    offenders, [],
    "Committing a file under content/newsletters/ publishes it to the public archive " +
      "immediately (lib/newsletters.ts reads every .md there). These have neither sendAt " +
      "nor sentAt, so they look like drafts that were committed by accident. If a draft: " +
      "`git rm --cached <file>` and keep it untracked until it is scheduled or sent. If it " +
      "really should be public and unsent, say so explicitly in LEGACY_UNSENT in this test."
  );
});

test("the legacy-unsent list has not silently grown stale", () => {
  const tracked = new Set(trackedIssues());
  for (const [file, why] of LEGACY_UNSENT) {
    assert.ok(tracked.has(file), `LEGACY_UNSENT names ${file}, which is no longer tracked — drop the entry`);
    const fm = frontmatter(file);
    assert.ok(
      !fm.sendAt && !fm.sentAt,
      `${file} now declares a send state, so its LEGACY_UNSENT entry is obsolete — remove it. (${why})`
    );
  }
});
