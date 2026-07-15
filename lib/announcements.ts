// ── Timely site-wide announcements ──────────────────────────────────────────
//
// The first entry whose [start, end] window contains today (America/New_York)
// is shown as a slim banner above the nav on every page. Order = priority.
// Dates are inclusive: end "2026-07-22" keeps the banner up through that day.
// Expired entries are harmless — leave them for history, or prune on touch.
//
// The weekly site-freshness agent proposes new entries here for upcoming
// events, launches, and cohort starts.

export type Announcement = {
  id: string; // stable slug; also the dismissal key
  text: string;
  href: string; // internal path or external URL
  cta: string; // short link label, e.g. "Details"
  start: string; // YYYY-MM-DD, first day shown
  end: string; // YYYY-MM-DD, last day shown (inclusive)
};

export const announcements: Announcement[] = [
  {
    id: "siggraph-2026",
    text: "Find me at SIGGRAPH 2026 — three sessions, July 19–22",
    href: "https://s2026.conference-schedule.org/presenter/?uid=645453",
    cta: "See the talks",
    start: "2026-07-14",
    end: "2026-07-22",
  },
  {
    id: "cohort-aug-2026",
    text: "Live Unreal classes return Aug 5 — early-bird seats through Jul 29",
    href: "/training#cohort",
    cta: "Reserve a seat",
    start: "2026-07-23",
    end: "2026-08-05",
  },
];
