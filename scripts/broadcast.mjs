#!/usr/bin/env node
/**
 * CLI campaign send — same engine as Newsletter Studio (lib/sendNewsletter.ts),
 * for when a terminal is handier than the UI. Prefer `npm run studio` for the
 * full flow (live counts, test sends, typed confirmation, reports).
 *
 * Usage:
 *   node scripts/broadcast.mjs --list newsletter --subject "…" --body issue.md [--broad] [--dry-run]
 *
 * --list      required. One of the slugs in lib/lists.ts.
 * --subject   required. Email subject line.
 * --body      required. Path to a markdown file (the same format as
 *             content/newsletters/*.md bodies — headings, bold, italic,
 *             links, images, captions, side-by-side rows all render).
 * --campaign  optional. Tracking/attribution slug — defaults to the body
 *             filename. Use the issue slug so opens/clicks/unsubs land on
 *             the right report.
 * --reason    optional. Overrides lib/lists.ts LIST_REASON for --list.
 * --broad     optional. Adds the "future newsletters will be more tailored"
 *             footer line — use for a send to the consolidated list.
 * --test      optional email address. Sends ONLY to that address (subject
 *             gets a [TEST] prefix) instead of the real list — for
 *             proofing content/images before the real send.
 * --dry-run   optional. Print recipient count + addresses, send nothing.
 *
 * Every email gets the attribution footer, a one-click unsubscribe link
 * (+ List-Unsubscribe headers), and open/click tracking — all from the
 * shared core; don't add your own footer.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { LIST_REASON, isListSlug } from "../lib/lists.ts";
import { sendCampaign, listRecipients } from "../lib/sendNewsletter.ts";

function loadEnvLocal() {
  // .env.studio first — survives the `vercel env pull` that clobbers .env.local.
  for (const file of ["../.env.studio", "../.env.local"]) {
    try {
      const txt = readFileSync(new URL(file, import.meta.url), "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          const v = m[2].replace(/^["']|["']$/g, "");
          if (v) process.env[m[1]] = v;
        }
      }
    } catch {
      /* file absent — fine */
    }
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadEnvLocal();
  const list = arg("list");
  const subject = arg("subject");
  const bodyPath = arg("body");
  const reason = arg("reason") ?? (isListSlug(list) ? LIST_REASON[list] : undefined);
  const broad = process.argv.includes("--broad");
  const dryRun = process.argv.includes("--dry-run");
  const testTo = arg("test");

  if (!list || !subject || !bodyPath) {
    console.error(
      "Usage: node scripts/broadcast.mjs --list <slug> --subject <text> --body <file.md> [--campaign <slug>] [--reason <text>] [--broad] [--dry-run]"
    );
    process.exit(1);
  }
  if (!reason) {
    console.error(`No reason text for list "${list}" — add it to LIST_REASON in lib/lists.ts or pass --reason "..."`);
    process.exit(1);
  }

  const campaign = arg("campaign") ?? path.basename(bodyPath).replace(/\.[a-z]+$/i, "");
  const bodyMarkdown = readFileSync(bodyPath, "utf8");

  if (testTo) {
    console.log(`Test send → ${testTo} (subject gets a [TEST] prefix; real list not touched)`);
    if (dryRun) {
      console.log("\n[dry run] nothing sent.");
      return;
    }
    const result = await sendCampaign({
      campaign,
      subject,
      bodyMarkdown,
      list,
      reason,
      broad,
      testTo: [testTo],
      onProgress: (sent, total) => console.log(`  sent ${sent}/${total}`),
    });
    console.log(`Done. ${result.sent}/${result.recipients} sent.`);
    if (result.errors.length) {
      console.error("Errors:", result.errors.join("; "));
      process.exit(1);
    }
    return;
  }

  const emails = await listRecipients(list);
  console.log(`List "${list}": ${emails.length} recipient(s). Campaign: "${campaign}"`);
  if (dryRun) {
    emails.forEach((e) => console.log("  " + e));
    console.log("\n[dry run] nothing sent.");
    return;
  }
  if (emails.length === 0) {
    console.log("No recipients — nothing to send.");
    return;
  }

  const result = await sendCampaign({
    campaign,
    subject,
    bodyMarkdown,
    list,
    reason,
    broad,
    onProgress: (sent, total) => console.log(`  sent ${sent}/${total}`),
  });
  console.log(`Done. ${result.sent}/${result.recipients} sent.`);
  if (result.errors.length) {
    console.error("Errors:", result.errors.join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
