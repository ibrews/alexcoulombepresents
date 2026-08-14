// ── Class materials — one shareable folder per class ───────────────────────
//
// Two audiences, one structure (Alex, 2026-08-14):
//   a) members            → every folder
//   b) individual signups → the folder for the class they bought
//
// Access is derived, never assigned by hand: an active `membership`
// entitlement opens everything, and a non-refunded catalog_orders row for the
// class's slug opens that one. A refund closes it again on its own, because
// purchasedSlugsForEmail() filters on refunded = false. Nobody has to
// remember to revoke anything.
//
// `slug` is deliberately the SAME string as the lib/store.ts item slug (e.g.
// "wed-2026-08-12-intro-vr"). That equality IS the entitlement link — a
// folder whose slug doesn't match a real store item can never be unlocked by
// purchase, so tests/class-materials.test.ts asserts every non-evergreen
// folder's slug resolves to a store item.

export type MaterialSource =
  // Small files committed to the repo under content/materials/. Streamed by
  // our own route, so they are genuinely gated. Keep these modest — anything
  // big belongs in R2; the repo is not a CDN.
  | { kind: "local"; file: string }
  // Anything large (UE projects, video). Zero-egress on Cloudflare R2, handed
  // out as a short-lived presigned URL. Needs R2_* env set — see lib/commerce/r2.ts.
  | { kind: "r2"; key: string }
  // A link we don't host: an existing Dropbox/Drive folder, a slide deck on
  // GitHub Pages. We still gate the REDIRECT, but be honest about what that
  // means — anyone who has the underlying URL can share it onward, so never
  // use `external` for something that must stay members-only.
  | { kind: "external"; url: string };

export type ClassMaterial = {
  key: string; // unique within the folder; the URL key
  label: string;
  source: MaterialSource;
  sizeLabel?: string; // human hint, e.g. "6.1 GB" — worth warning people
  note?: string;
};

export type ClassFolder = {
  slug: string;
  title: string;
  date?: string; // ISO; omit for evergreen folders
  blurb: string;
  // When true, this folder is a members-only perk with no matching class to
  // buy (the cross-class library). Purchase can never unlock it.
  membersOnly?: boolean;
  recordingSlug?: string; // matches lib/recordings.ts, for cross-linking
  materials: ClassMaterial[];
};

export const classFolders: ClassFolder[] = [
  {
    slug: "wed-2026-08-12-intro-vr",
    title: "Intro to VR",
    date: "2026-08-12",
    blurb:
      "Slides and project files from the Intro to VR class — how VR works, the current headset landscape, and getting an Unreal project onto a headset.",
    recordingSlug: "intro-to-vr-2026-08-12",
    materials: [
      {
        key: "slides",
        label: "Slide deck (PDF)",
        source: { kind: "local", file: "2026-08-12-intro-to-vr-slides.pdf" },
        sizeLabel: "4.8 MB",
      },
      {
        key: "ue-project",
        label: "Course Unreal project (UE 5.3)",
        // NOT yet uploaded — R2 credentials aren't available on this machine.
        // The folder, the gating and the UI are all live; this one entry
        // 404s at the route until the object exists, which is why
        // materialAvailable() exists and the page renders it as "coming
        // soon" rather than as a button that fails.
        source: { kind: "r2", key: "class-materials/wed-2026-08-12-intro-vr/216.03_UET_53.zip" },
        sizeLabel: "6.1 GB",
        note: "Large download — 2,110 files. Unreal Engine 5.3 project.",
      },
    ],
  },
  {
    slug: "members-library",
    title: "The members' library",
    membersOnly: true,
    blurb:
      "Cross-class material that doesn't belong to any single session — reference decks, starter projects, and the back catalog of course content from earlier training.",
    materials: [
      {
        key: "ue5-3-course-content-2023",
        label: "Intro to UE 5.3 — course content (Oct 2023)",
        source: {
          kind: "external",
          url: "https://www.dropbox.com/sh/ggf7ax7hay333fs/AACmG7NdjjCUyXV69xM2enqwa?dl=0",
        },
        note: "Hosted on Dropbox — the original class link.",
      },
      {
        key: "ue5-3-course-content-2023-11",
        label: "Intro to UE 5.3 with Josi Morgan — course content (Nov 2023)",
        source: {
          kind: "external",
          url: "https://www.dropbox.com/scl/fo/3lds0nqdp6qib2dpurb0v/h?rlkey=tq1k8vh7gq8m58w5ie6t1n94b&dl=0",
        },
        note: "Hosted on Dropbox — the original class link.",
      },
      {
        key: "intro-vr-2024-slides",
        label: "Intro to Virtual Reality — slide deck (Jun 2024)",
        source: {
          kind: "external",
          url: "https://drive.google.com/file/d/1KMjkLO0LO671bgwkeGxf4uclbuPthOn3/view",
        },
        note: "Hosted on Google Drive — the original class link.",
      },
    ],
  },
];

export function findClassFolder(slug: string): ClassFolder | undefined {
  return classFolders.find((f) => f.slug === slug);
}

export function findMaterial(
  folderSlug: string,
  key: string
): { folder: ClassFolder; material: ClassMaterial } | undefined {
  const folder = findClassFolder(folderSlug);
  const material = folder?.materials.find((m) => m.key === key);
  return folder && material ? { folder, material } : undefined;
}

// Whether a material can actually be served right now. An `r2` source is only
// deliverable once the bucket is configured — without this the UI would offer
// a Download button that 500s, which is worse than saying "not up yet".
export function materialAvailable(material: ClassMaterial): boolean {
  if (material.source.kind !== "r2") return true;
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET);
}

export function materialHref(folderSlug: string, key: string): string {
  return `/api/materials?class=${encodeURIComponent(folderSlug)}&key=${encodeURIComponent(key)}`;
}
