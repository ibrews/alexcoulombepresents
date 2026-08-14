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
  // Renders first and as the main call to action. Used for the shared
  // Drive/Dropbox folder that holds the bulk of a class's content, so the
  // page reads "here's the folder" rather than burying it among loose files.
  primary?: boolean;
};

// The shared-folder entry for a class. Chosen over a top-level `driveUrl`
// field on ClassFolder specifically so it flows through the SAME gating,
// the same route and the same tests as every other material — a second
// access path is a second thing that can be wrong.
//
// Honest about what this does and doesn't do: the site decides who is shown
// the link. Once shown, the underlying Drive URL is a normal shareable URL
// and can be forwarded. That matches the security of the Dropbox/Drive links
// these classes already shipped with; use `r2` instead for anything where
// leaking actually costs money.
export function sharedFolder(input: {
  url: string;
  host?: string; // "Google Drive" (default), "Dropbox", …
  note?: string;
}): ClassMaterial {
  const host = input.host ?? "Google Drive";
  return {
    key: "folder",
    label: `Class folder on ${host}`,
    source: { kind: "external", url: input.url },
    note: input.note ?? "Everything for this class — slides, project files, and assets.",
    primary: true,
  };
}

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
    title: "Intro to VR in Unreal 5.8",
    date: "2026-08-12",
    blurb:
      "How virtual reality actually works, the current headset landscape, and getting an Unreal project running on a headset.",
    recordingSlug: "intro-to-vr-2026-08-12",
    materials: [
      // "Public Classes / Intro to VR" — holds Assets/ and Recordings/.
      // Assets/project files only — the recording is YouTube, linked
      // directly below via recordingSlug, not duplicated into Drive.
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1QlL8cbw06yneEyLydocbPjZr2XOOZgJu",
        note: "Class assets and project files. Opens in Google Drive.",
      }),
      {
        key: "slides",
        label: "Slide deck (PDF)",
        source: { kind: "local", file: "2026-08-12-intro-to-vr-slides.pdf" },
        sizeLabel: "4.8 MB",
      },
      // The 6.1 GB course project (216.03_UET_53.zip) rides in the shared
      // folder above. If Drive's per-file download quota ever locks it —
      // plausible for a file this size across a full class — move it to R2
      // instead and it becomes a presigned, expiring link:
      //   node scripts/upload-class-material.mjs <file> \
      //     class-materials/wed-2026-08-12-intro-vr/216.03_UET_53.zip
      // then add:
      //   { key: "ue-project", label: "Course Unreal project (UE 5.3)",
      //     source: { kind: "r2", key: "class-materials/wed-2026-08-12-intro-vr/216.03_UET_53.zip" },
      //     sizeLabel: "6.1 GB" },
    ],
  },
  {
    slug: "wed-2026-08-19-intermediate-vr",
    title: "Intermediate XR in Unreal 5.8",
    date: "2026-08-19",
    blurb:
      "Past the basics: interaction, locomotion, and the performance work that keeps an XR build comfortable.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1qKqDuYP5UsLVLnkFnMQdQhd_Ej12LqWO",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-08-26-intro-metahumans",
    title: "Intro to MetaHumans in Unreal 5.8",
    date: "2026-08-26",
    blurb:
      "Building, customizing, and animating MetaHumans, and getting one into your own project.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1mIac_K-YSAKPGoPA95zIkrsXMHcdROY1",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-09-02-mocap",
    title: "Mocap in Unreal 5.8",
    date: "2026-09-02",
    blurb:
      "Motion capture into Unreal — capture options, cleanup, and retargeting onto your character.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1y0uyZMTudxrUw0PKUeBuOmvEatty5Uez",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-09-09-intro-pcg",
    title: "Intro to PCG & AI",
    date: "2026-09-09",
    blurb:
      "Procedural Content Generation in Unreal, and where AI tooling genuinely speeds up the work.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1fJq7GfPX2TPpt9J5ftewDwTkSQ0P3L9P",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-09-16-unity-to-unreal",
    title: "Unity to Unreal",
    date: "2026-09-16",
    blurb:
      "The transition class: what maps across, what doesn't, and the habits worth unlearning.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1zxI_LUn4jUVvwqtlX9xDQMoBZ-TMWS8j",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-09-23-usd-glb-export",
    title: "Exporting UE5 to OpenUSD to GLB",
    date: "2026-09-23",
    blurb:
      "Getting scenes out of Unreal and into the rest of the pipeline via OpenUSD and glTF/GLB.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1jXeYji2mo57tuR76jYjfG_1C0ppjbJzD",
        note: "Class assets land here around class time.",
      }),
    ],
  },
  {
    slug: "wed-2026-09-30-intro-ar",
    title: "Intro to AR",
    date: "2026-09-30",
    blurb:
      "Augmented reality fundamentals and building your first AR experience in Unreal.",
    materials: [
      sharedFolder({
        url: "https://drive.google.com/drive/folders/1JLyN_VpJhuHGo3GpwkC-yeBeSzK0avTD",
        note: "Class assets land here around class time.",
      }),
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

// ── Access rule ──────────────────────────────────────────────────────────
//
// Pure and DB-free on purpose, colocated with the data it operates over
// rather than with lib/commerce/materialAccess.ts's DB-touching
// accessForCustomer() — that split is what lets tests/class-materials.test.ts
// exercise the actual "who can open this" decision (e.g. "a rerun of the
// same class title never opens on another session's purchase") without
// dragging in lib/commerce/{membership,entitlements,seats}.ts, none of which
// resolve under plain `node --test` (their extensionless relative imports —
// e.g. `import { sql } from "./schema"` — are fine for Next's bundler but
// Node's own ESM loader doesn't do TypeScript-style extension inference, so
// importing that chain directly in a test throws ERR_MODULE_NOT_FOUND before
// a single assertion runs). materialAccess.ts re-exports both functions
// unchanged, so nothing that already imports them from there needs to move.

export type MaterialAccess = {
  member: boolean;
  purchasedSlugs: string[];
};

export function canOpen(folder: ClassFolder, access: MaterialAccess): boolean {
  if (access.member) return true;
  if (folder.membersOnly) return false;
  return access.purchasedSlugs.includes(folder.slug);
}

export function foldersFor(access: MaterialAccess): { folder: ClassFolder; open: boolean }[] {
  return classFolders.map((folder) => ({ folder, open: canOpen(folder, access) }));
}
