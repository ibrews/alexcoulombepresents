import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PLUGIN_UPDATES } from "../lib/commerce/pluginUpdates.ts";

// Why: the update-check toast in every shipped plugin links to notes_url. For weeks all five rows
// pointed at /plugins/<slug>/releases, routes that were never built, so the link 404ed on click.
// A same-origin notes_url must resolve to an app route that actually exists in this repo.
const SITE_ORIGIN = "https://www.alexcoulombepresents.com";

test("every same-origin notes_url resolves to a page this app actually serves", () => {
  for (const [product, info] of Object.entries(PLUGIN_UPDATES)) {
    const url = new URL(info.notes_url);
    if (url.origin !== SITE_ORIGIN) continue; // external pages are verified live, not here
    const segments = url.pathname.split("/").filter(Boolean);
    const page = join(process.cwd(), "app", ...segments, "page.tsx");
    assert.ok(existsSync(page), `${product}: notes_url ${info.notes_url} has no page at ${page}`);
  }
});
