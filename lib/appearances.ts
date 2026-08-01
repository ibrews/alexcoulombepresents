// ── Public appearances — talks, judging, mentoring ─────────────────────────
//
// Feeds the homepage "What's next" section (#appearances) and the site-wide
// announcement banner (lib/announcements.ts links here). Keep entries even
// after they pass — they become the historical "featured in" record. Order:
// soonest-first; the homepage section doesn't re-sort.
//
// `endsISO` is what keeps the section honest: once it passes, the entry moves
// itself out of "what's next" and into the "recently" row below — no manual
// edit needed on the day an event ends.

export type Appearance = {
  slug: string;
  role: string; // "Speaker", "Judge + Mentor", "Panelist"...
  title: string;
  org: string;
  date: string; // human-readable range, e.g. "Jul 18–19, 2026"
  endsISO: string; // instant the appearance is over; past this it reads as history
  location: string;
  url: string;
  image?: string; // path under /public
};

export const appearances: Appearance[] = [
  {
    slug: "pmre-2026-keynote",
    role: "Keynote Speaker",
    title: "Keynote", // TODO(alex): swap in your actual talk title/topic
    org: "PMRE 2026 — Photo + Media for Real Estate Conference",
    date: "Nov 17–19, 2026",
    endsISO: "2026-11-20T06:00:00Z",
    location: "Palms Casino Resort, Las Vegas",
    url: "https://www.pmreconference.com/",
  },
  {
    slug: "worlds-in-action-hack-la",
    role: "Judge + Mentor",
    title: "Worlds in Action Hack [02-LA]",
    org: "Sensai, with World Labs, PICO, and SIGGRAPH 2026",
    date: "Jul 18–19, 2026",
    endsISO: "2026-07-20T04:00:00Z",
    location: "MG Studio, Los Angeles",
    url: "https://sensaihack.com/worldsinaction-2-la/",
    image: "/worlds-in-action-hack.jpg",
  },
  {
    slug: "siggraph-2026-stage-presence",
    role: "Speaker",
    title: "Stage Presence: Design and Testing of a Virtual Rehearsal Room Toolset",
    org: "SIGGRAPH 2026",
    date: "Sun Jul 19, 4:25–4:45pm PT",
    endsISO: "2026-07-19T23:45:00Z",
    location: "Room 403 B, Los Angeles",
    url: "https://s2026.conference-schedule.org/presenter/?uid=645453",
  },
  {
    slug: "siggraph-2026-gaussian-splats",
    role: "Instructor",
    title: "Powered by Gaussian Splats: From World Models to 3D Interactive Worlds",
    org: "SIGGRAPH 2026 — Hands-on Course",
    date: "Mon Jul 20, 3:30–5:00pm PT",
    endsISO: "2026-07-21T00:00:00Z",
    location: "Concourse Hall, Los Angeles",
    url: "https://s2026.conference-schedule.org/presenter/?uid=645453",
  },
  {
    slug: "siggraph-2026-virtual-theatre",
    role: "Panelist",
    title: "Virtual Theatre: Producing Live Theatre on Virtual Stages",
    org: "SIGGRAPH 2026",
    date: "Wed Jul 22, 1:00–1:45pm PT",
    endsISO: "2026-07-22T20:45:00Z",
    location: "Concourse Hall, Los Angeles",
    url: "https://s2026.conference-schedule.org/presenter/?uid=645453",
  },
];
