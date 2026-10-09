// ── Trailers — the short promo videos cut for the Oct 7, 2026 livestream ────
// Files live in public/trailers/ (720p H.264 + AAC, faststart, 1–2 MB each;
// the reel is ~11 MB). Each has a poster frame with the same basename. The
// source cuts and the music versions are in ~/Archives/acp-trailers-2026-10/
// and the livestream deck repo (ibrews/acp-livestream-2026-10-07).

export type TrailerAccess =
  | "membership" // the pitch for membership itself
  | "members-lab" // a shipping tool members get today
  | "coming-to-lab" // in progress; Insider early access
  | "plugin" // an Unreal plugin still in development
  | "open-source"; // free for everyone

export type Trailer = {
  slug: string; // public/trailers/<slug>.mp4 and .jpg
  title: string;
  tagline: string;
  durationSec: number;
  access: TrailerAccess;
  href?: string; // where to learn more
};

export const ACCESS_LABEL: Record<TrailerAccess, string> = {
  membership: "Membership",
  "members-lab": "In the members' Lab",
  "coming-to-lab": "Coming to the Lab · Insider early access",
  plugin: "Unreal plugin · in development",
  "open-source": "Free & open source",
};

export const trailers: Trailer[] = [
  {
    slug: "become-a-member",
    title: "Become a member",
    tagline: "Tutorials go stale. Live classes don't.",
    durationSec: 36,
    access: "membership",
  },
  {
    slug: "all-tools-reel",
    title: "Every tool, one reel",
    tagline: "The whole Lab and every plugin in a little over three minutes.",
    durationSec: 196,
    access: "membership",
  },
  {
    slug: "xrsim",
    title: "xrsim",
    tagline: "Test VR apps without a headset — a simulated headset you drive from the browser.",
    durationSec: 26,
    access: "members-lab",
  },
  {
    slug: "forage",
    title: "Forage",
    tagline: "Describe the scene; it finds the right packs in the Unreal assets you already own.",
    durationSec: 23,
    access: "members-lab",
  },
  {
    slug: "constellation",
    title: "Constellation",
    tagline: "Your notes as a walk-in star map on Apple Vision Pro.",
    durationSec: 22,
    access: "members-lab",
  },
  {
    slug: "promptbook",
    title: "Promptbook",
    tagline: "Block a show on a tabletop stage, then promote it to full scale on Vision Pro.",
    durationSec: 22,
    access: "members-lab",
  },
  {
    slug: "pinchwork",
    title: "Pinchwork",
    tagline: "Hand tracking for Unreal that isn't written for one headset.",
    durationSec: 17,
    access: "coming-to-lab",
  },
  {
    slug: "urkpreviewer",
    title: "URKPreviewer",
    tagline: "See your Unreal scene in the headset while you're still editing it.",
    durationSec: 20,
    access: "plugin",
    href: "/plugins",
  },
  {
    slug: "urmbridge",
    title: "URMBridge",
    tagline: "Unreal for the speed, RenderMan for the frame — one menu click.",
    durationSec: 23,
    access: "plugin",
    href: "/plugins",
  },
  {
    slug: "sceneaudit",
    title: "SceneAudit",
    tagline: "Numeric verdicts on 3D placement — floating, offset, wrong scale — before anyone sees the shot.",
    durationSec: 22,
    access: "plugin",
    href: "/plugins",
  },
  {
    slug: "blueprint-anti-pasta",
    title: "Blueprint Anti-Pasta",
    tagline: "Blueprint spaghetti met its match: one shortcut and the graph lays itself out.",
    durationSec: 22,
    access: "open-source",
    href: "https://github.com/ibrews/blueprint-auto-layout",
  },
];

export function trailer(slug: string): Trailer {
  const t = trailers.find((x) => x.slug === slug);
  if (!t) throw new Error(`No trailer "${slug}" in lib/trailers.ts`);
  return t;
}

export function trailersFor(...access: TrailerAccess[]): Trailer[] {
  return trailers.filter((t) => access.includes(t.access));
}
