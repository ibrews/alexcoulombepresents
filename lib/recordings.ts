// ── Members' recording library — data ───────────────────────────────────────
// Interim delivery per business plan §2.6: a gated list of links to wherever
// each recording is hosted (unlisted video, R2 object, etc.). The HLS-on-R2
// player replaces `url` links later — this shape is forward-compatible with
// that (slug becomes the player route param).
//
// To publish a recording: append an entry here. The library page
// (/members/recordings) is gated on the `membership` entitlement, so links
// only ever render for signed-in, active members.

export type Recording = {
  slug: string;
  title: string;
  recordedAt: string; // ISO date, e.g. "2026-08-14"
  description: string;
  url: string; // interim: direct link to the hosted recording
  durationMin?: number;
  topics?: string[];
};

export const recordings: Recording[] = [
  // No recordings published yet — the library fills as classes run.
  // {
  //   slug: "unreal-fundamentals-2026-08",
  //   title: "Unreal Fundamentals — August cohort, session 1",
  //   recordedAt: "2026-08-14",
  //   description: "Editor tour, project setup, and the first Blueprint.",
  //   url: "https://…",
  //   durationMin: 90,
  //   topics: ["unreal", "fundamentals"],
  // },
];
