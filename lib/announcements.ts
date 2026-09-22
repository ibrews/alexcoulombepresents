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
  // Presence only. Alex confirmed he is attending; Meta's developer site is
  // the source for the Sep 23–24 dates. This expires with the event and makes
  // no claim about a session, demo, badge, or speaking slot.
  {
    id: "meta-connect-2026",
    text: "Alex is at Meta Connect Sep 23–24 — say hello if you're there",
    href: "/contact",
    cta: "Say hello",
    start: "2026-09-22",
    end: "2026-09-24",
  },
  // Takes over when Connect ends. The Sep 23 class has passed by this point,
  // so this names only the final bookable session instead of carrying stale
  // "last two classes" copy forward.
  {
    id: "wed-calendar-final",
    text: "Final class of the run — UE5 to USD to GLB Sep 30, code UE5 for 50% off",
    href: "/training#calendar",
    cta: "Book a seat",
    start: "2026-09-25",
    end: "2026-09-30",
  },
  // Picks up the day after the last dated class without guessing the next
  // schedule. The vote page remains the source of truth for what comes next.
  {
    id: "vote-next-run",
    text: "The Wednesday run just wrapped — what gets taught next is decided by vote",
    href: "/vote",
    cta: "Cast a vote",
    start: "2026-10-01",
    end: "2026-10-31",
  },
  {
    id: "la-week-2026",
    text: "In LA this week — judging Worlds in Action Hack (Jul 18–19) + 3 SIGGRAPH talks (Jul 19–22)",
    href: "/#appearances",
    cta: "See where",
    start: "2026-07-16",
    end: "2026-07-22",
  },
  // Split at the early-bird cutoff so the banner can't still be advertising a
  // discount the store stopped honoring. lib/store.ts steps the price itself on
  // 2026-07-30T04:00:00Z (Jul 29 EOD ET); these two windows meet at that seam.
  {
    id: "cohort-aug-2026",
    text: "Live Unreal classes return Aug 5 — early-bird seats through Jul 29",
    href: "/training#cohort",
    cta: "Reserve a seat",
    start: "2026-07-23",
    end: "2026-07-29",
  },
  {
    id: "cohort-aug-2026-final",
    text: "Free live Unreal class Wed Aug 5, 11a ET — help decide what's next",
    href: "/training#cohort",
    cta: "Reserve a free seat",
    start: "2026-07-30",
    // Ends the day of class itself — the free session is the event, not a
    // cutoff, so keep the banner up through Aug 5.
    end: "2026-08-05",
  },
  // Placed ahead of drainspotting-launch (order = priority) so the real
  // calendar — 8 dated, bookable Wednesday classes — takes over the banner
  // the moment it ships, through the last class in the run (Sep 30). No
  // price in the copy since it varies per class; the calendar itself has
  // the real numbers.
  {
    id: "wed-calendar-launch",
    text: "New classes available for sign-up — book any Wednesday session, code UE5 for 50% off",
    href: "/training#calendar",
    cta: "See the calendar",
    start: "2026-08-07",
    end: "2026-09-30",
  },
  // Deliberately starting Aug 6: its window overlaps the free-class banner
  // above, and first-match-in-order means the dated live event keeps
  // priority while it's still ahead. Superseded by wed-calendar-launch
  // above from Aug 7 on. No price in the copy — launch-week pricing lives
  // in lib/commerce/products.ts and can move without touching this.
  {
    id: "drainspotting-launch",
    text: "Drainspotting is out — find out what actually drained your Mac's battery",
    href: "/store#drainspotting",
    cta: "Get it",
    start: "2026-08-06",
    end: "2026-09-06",
  },
];
