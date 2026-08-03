// ── Members' Spatial Deck presentation library — data ───────────────────────
// Alex's public talks are already discoverable one at a time via /appearances,
// but the actual interactive Spatial Deck presentations behind them weren't
// consolidated anywhere. This is that list — a member perk, gated the same
// way /members/tools is: everyone sees what's here, only signed-in members
// get the deck link itself.

export type SpatialDeckTalk = {
  slug: string;
  title: string;
  venue: string;
  date: string;
  summary: string;
  deckUrl: string;
};

export const spatialDeckTalks: SpatialDeckTalk[] = [
  {
    slug: "harvardxr-2026-keynote",
    title: "10 Lessons from 10 Years of Running an XR Enterprise Studio",
    venue: "HarvardXR 2026 — closing keynote",
    date: "April 2026",
    summary:
      "Two interactive slides open the talk: 2010 Alex pinballs between three separate passions — architecture, theatre, realtime tech — until 2013 finds the headset that merges them into one career. Built in Spatial Deck itself: a chiptune power-up sequence, a client-logo carousel, and a tool-journey timeline, all navigable live rather than clicked through as static slides.",
    deckUrl: "https://ibrews.github.io/harvardxr-keynote/",
  },
];
