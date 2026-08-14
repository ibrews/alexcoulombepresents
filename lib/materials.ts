// ── Members' class materials — gated file registry ─────────────────────────
//
// Slide decks and handouts that ship with a class recording. Files live in
// content/materials/ (NOT public/) so the only way to them is
// /api/members/material?key=…, which checks the membership entitlement first.
// content/ is already read at runtime by lib/curriculum.ts, so the directory
// is traced into the serverless bundle.
//
// External materials (a public Dropbox/Drive link from an old class) don't
// belong here — put those straight in the recording's `materials` as a URL.

import path from "node:path";

export type Material = {
  key: string; // URL key: /api/members/material?key=<key>
  file: string; // filename under content/materials/
  contentType: string;
  downloadAs: string; // filename the browser saves it as
};

export const MATERIALS_DIR = path.join(process.cwd(), "content", "materials");

export const materials: Material[] = [
  {
    key: "intro-to-vr-2026-08-12-slides",
    file: "2026-08-12-intro-to-vr-slides.pdf",
    contentType: "application/pdf",
    downloadAs: "Intro to VR — Aug 12, 2026 (slides).pdf",
  },
];

export function findMaterial(key: string): Material | undefined {
  return materials.find((m) => m.key === key);
}

// The href a recording entry points at. Kept here so the route and the data
// file can never drift on the query-param name.
export function materialHref(key: string): string {
  return `/api/members/material?key=${encodeURIComponent(key)}`;
}
