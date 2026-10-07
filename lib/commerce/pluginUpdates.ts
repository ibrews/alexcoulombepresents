// ── UE plugin update manifest ───────────────────────────────────────────────
// Backing data for the public, anonymous GET /api/plugins/updates version
// check. NO customer data, NO license info, NO direct binary URLs belong in
// this file or the route that serves it — ever.
//
// For now this is a hand-edited constant; a real content-managed version
// (CMS-backed or DB-backed) can replace it later without changing the route
// or the response shape. Bumping a release is a one-line edit to the row
// below — no other code needs to change.

import type { PluginProduct } from "./pluginLicensing";

export type PluginUpdateInfo = {
  latest: string;
  released: string; // YYYY-MM-DD
  notes_url: string;
  min_ue: string;
};

export const PLUGIN_UPDATES: Record<PluginProduct, PluginUpdateInfo> = {
  // Real versions, 2026-10-07 (the 1.0.0s here were never built — found by
  // the member-tools fleet lane). URMBridge 0.2.0 is a DRAFT GitHub release
  // (ibrews/UnrealRenderManBridge, 2026-10-01) delivered by Alex directly
  // until he publishes it; Blueprint Anti-Pasta 0.6.9 is published.
  URMBridge: {
    latest: "0.2.0",
    released: "2026-10-01",
    notes_url: "https://www.alexcoulombepresents.com/plugins/urmbridge/releases",
    min_ue: "5.6",
  },
  SceneAudit: {
    latest: "0.1.0",
    released: "2026-08-10",
    notes_url: "https://www.alexcoulombepresents.com/plugins/sceneaudit/releases",
    min_ue: "5.6",
  },
  Forage: {
    latest: "0.1.0",
    released: "2026-08-07",
    notes_url: "https://www.alexcoulombepresents.com/plugins/forage/releases",
    min_ue: "5.8",
  },
  BPAutoLayout: {
    latest: "0.6.9",
    released: "2026-06-03",
    notes_url: "https://www.alexcoulombepresents.com/plugins/bpautolayout/releases",
    min_ue: "4.27",
  },
  URKPreviewer: {
    latest: "0.1.0",
    released: "2026-08-09",
    notes_url: "https://www.alexcoulombepresents.com/plugins/urkpreviewer/releases",
    min_ue: "5.7",
  },
};

export const PLUGIN_UPDATES_MANIFEST = {
  schema: 1,
  products: PLUGIN_UPDATES,
} as const;
