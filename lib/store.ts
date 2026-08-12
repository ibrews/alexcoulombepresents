// ── Store catalog — direct sales, no middleman ──────────────────────────────
//
// PAYMENTS MODEL
// Checkout runs through Stripe Checkout (created server-side in
// app/api/checkout/route.ts). Stripe is a PROCESSOR, not a marketplace:
// the only cut anyone takes is card processing (~2.9% + 30¢; ACH/Link is
// cheaper). No platform commission, ever. For true zero-fee purchases every
// item also exposes an "invoice me" path (ACH/Zelle/check via email).
//
// PRICING — STORE_LIVE is ON in production: Stripe charges real cards at the
// prices below right now. The August cohort's early-bird cutoff and start
// date are enforced automatically (see earlyBird/saleWindow + effectivePrice-
// Cents/isPurchasable below) so an expired or already-started listing can't
// silently keep taking money — no manual edit needed when those dates pass.
//
// ⚠️ CHANNEL / EULA GUARDRAILS (check before flipping an item live):
// - Fab listings: Epic's distribution license is NON-exclusive — selling your
//   own product off-Fab is generally fine, but re-confirm per listing, and
//   never sell anything containing Epic-owned content (MetaHuman assets,
//   starter content) outside Fab's covered surface.
// - Capafy: confirm the creator agreement allows selling the same skill
//   direct before listing it here. (Unverified as of 2026-06-11 — TODO.)
// - Gumroad: non-exclusive; cross-listing is fine.
// - Anything derived from a private UE-source repo stays behind Epic-linked
//   access and is NOT sellable here.

export type StoreItem = {
  slug: string;
  name: string;
  kind: "course" | "course-bundle" | "skill" | "template" | "repo-access";
  priceCents: number | null; // null = inquiry-only (no checkout button)
  priceNote?: string;
  compareAt?: string[]; // crossed-off reference prices, e.g. "Intro class $99"
  // Fulfilled by an external storefront (e.g. Capafy), NOT direct Stripe
  // checkout here. Set this for anything we can't reliably auto-deliver
  // ourselves yet — the card links out instead of taking money we can't honor.
  externalUrl?: string;
  // For inquiry-only items (priceCents null): override the default "Inquire →"
  // button label and the signup list the email lands on.
  ctaLabel?: string;
  list?: string;
  // Whether Stripe Checkout accepts promo codes (vouchers, NEWSLETTER20) for
  // this item. Defaults to true; set false on premium items (e.g. the private
  // 1:1) that shouldn't be discountable and aren't voucher-eligible.
  allowPromoCodes?: boolean;
  // When true, no page on the site renders this item's numeric price — the
  // buyer only sees it on the real Stripe Checkout page (which always shows
  // the line-item amount; that's Stripe's UI, not ours, so it can't be
  // hidden there too). Checkout still charges priceCents exactly as normal.
  hidePrice?: boolean;
  blurb: string;
  delivery: string; // what the buyer receives, in plain words
  fulfillment: "email-manual" | "github-invite" | "download-link" | "booking";
  // Price steps up automatically once `untilISO` passes — no manual edit
  // needed on the cutoff day. `regularPriceCents` becomes the new priceCents.
  earlyBird?: { untilISO: string; regularPriceCents: number };
  // Item stops being purchasable once `closesAtISO` passes (e.g. a cohort
  // that has already started). Checkout blocks it server-side regardless of
  // whether the marketing page has re-rendered yet.
  saleWindow?: { closesAtISO: string; closedNote: string; closedList: string };
  // Hard seat cap for real scarcity (not just marketing copy). When set, the
  // store page shows remaining seats and the checkout API refuses to sell
  // past it (see lib/commerce/seats.ts + app/api/checkout/route.ts).
  capacity?: number;
  // Set on a specific dated live session (the /training calendar). Drives
  // sort order and the class-checkin cron's "is this the Tuesday before a
  // Wednesday session" math (lib/commerce/classCheckin.ts) — NOT read by
  // checkout/seat logic, which still keys off saleWindow/capacity like every
  // other item.
  sessionDateISO?: string;
  // Below this many paid seats by the Tuesday before sessionDateISO, Alex
  // gets a Telegram go/no-go prompt instead of the class running silently
  // undersold (see the class-checkin cron). Only meaningful alongside
  // sessionDateISO.
  minEnrollment?: number;
  // A real self-serve scheduling link (Zoom Scheduler event type, Zoom
  // registration-required meeting, etc.) — when set, the buyer picks a real
  // slot/registers themselves instead of waiting on a manual reply-email
  // round-trip. Surfaced in the fulfillment email in place of item.delivery's
  // "Alex will follow up" framing.
  schedulingUrl?: string;
  // Real Zoom "registration required" meeting link for a dated class —
  // Zoom handles confirmation/reminders/calendar invites automatically once
  // the buyer registers. Set per wednesdayCalendar item once its meeting
  // exists; surfaced in the fulfillment email in place of "Alex emails the
  // Zoom link before class."
  zoomRegistrationUrl?: string;
  // The real numeric Zoom meeting ID behind zoomRegistrationUrl — a
  // registration URL's token doesn't decode to this, so it's a separate
  // field, only set when the meeting was created via
  // scripts/zoom/create-class-meeting.mjs (which prints both). When set,
  // the buyer is auto-registered on purchase (app/api/stripe-webhook) in
  // addition to receiving the link — belt-and-suspenders, since the
  // auto-registration is best-effort and must never block a real purchase.
  zoomMeetingId?: string;
};

export const STORE_LIVE = process.env.NEXT_PUBLIC_STORE_LIVE === "1";

// The base (non-introductory) price for open-enrollment sessions — single
// source of truth so the voucher's and the calendar's crossed-out comparison
// prices can never drift from the actual per-session prices. Three tiers:
// intro/intermediate/expert. The Aug–Sep 2026 Wednesday calendar below sells
// at roughly half these as introductory pricing for that run specifically —
// these constants are what it's "off of", not what it charges.
const INTRO_SESSION_CENTS = 10000;
const INTERMEDIATE_SESSION_CENTS = 15000;
const ADVANCED_SESSION_CENTS = 20000; // "Expert" tier

// ── Aug–Sep 2026 Wednesday calendar ─────────────────────────────────────────
// Each is a real dated session (11a ET) at the standard tier price — the 50%
// intro discount for this run is a Stripe promo code ("UE5", 50% off once;
// see lib/commerce/vouchers.ts's header comment for why this lives as a real
// Stripe coupon+promotion_code rather than a lower priceCents: the price a
// customer sees pre-checkout should match what a receipt/refund actually
// references, and a stackable promo code degrades safely (worst case: it just
// doesn't apply) where a silently-discounted priceCents cannot expire on its
// own. `minEnrollment: 5` + `sessionDateISO` feed the class-checkin cron
// (lib/commerce/classCheckin.ts): if fewer than 5 are signed up by the
// Tuesday before, Alex gets a Telegram go/no-go prompt instead of the class
// running silently undersold. Recordings are included for every buyer
// regardless of live attendance. Dates/topics subject to change — if Alex
// reschedules, buyers can swap to another class anytime or get a refund
// (manual for now, same as any other refund request).
const UE5_PROMO_NOTE =
  "Use code UE5 at checkout for 50% off this 8-week run. Runs with 5+ signed up; " +
  "under that by the Tuesday before, everyone gets a coupon worth 110% of what they paid or a full refund, their choice. " +
  "Student or between jobs? Email for a sliding-scale seat — no questions asked.";

function wednesdayCalendarItem(input: {
  slug: string;
  name: string;
  blurb: string;
  priceCents: number;
  sessionDateISO: string; // 11a ET start
  zoomRegistrationUrl?: string;
  zoomMeetingId?: string;
}): StoreItem {
  return {
    slug: input.slug,
    name: input.name,
    kind: "course",
    priceCents: input.priceCents,
    priceNote: UE5_PROMO_NOTE,
    blurb: input.blurb,
    delivery: input.zoomRegistrationUrl
      ? "Order confirmation lands right away with your Zoom registration link — register and Zoom handles the calendar invite and reminders. The recording is yours afterward even if you can't make it live."
      : "Order confirmation lands right away; Alex emails the Zoom link and calendar invite before class. The recording is yours afterward even if you can't make it live.",
    fulfillment: "email-manual",
    sessionDateISO: input.sessionDateISO,
    minEnrollment: 5,
    zoomRegistrationUrl: input.zoomRegistrationUrl,
    zoomMeetingId: input.zoomMeetingId,
    saleWindow: {
      closesAtISO: input.sessionDateISO,
      closedNote: "This session has already happened — the next one's on the calendar above.",
      closedList: "unreal",
    },
  };
}

export const wednesdayCalendar: StoreItem[] = [
  wednesdayCalendarItem({
    slug: "wed-2026-08-12-intro-vr",
    name: "Intro to VR in Unreal 5.8",
    blurb:
      "Build your first VR experience! Headset optional (we've got a killer custom emulator!). OpenXR for the win. All the basics and your burning questions all answered.",
    priceCents: INTRO_SESSION_CENTS,
    sessionDateISO: "2026-08-12T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/Nn4mW45KRKeDkokoTk4o0A",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-08-19-intermediate-vr",
    name: "Intermediate XR in Unreal 5.8",
    blurb:
      "Beyond the basics: hand tracking, comfort options, various locomotion, fidelity and performance budgets. A dash of mixed reality at the end.",
    priceCents: INTERMEDIATE_SESSION_CENTS,
    sessionDateISO: "2026-08-19T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/2rQ9e2yxSu68RM8Otdm-RA",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-08-26-intro-metahumans",
    name: "Intro to MetaHumans in Unreal 5.8",
    blurb:
      "Create MetaHumans the new way: from in editor, and even from external face and body meshes. Realistic and stylized. Let's make 'em move and try the new toon shading while we're at it.",
    priceCents: INTRO_SESSION_CENTS,
    sessionDateISO: "2026-08-26T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/IzjAamgLQTibb6xeFARbBQ",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-09-02-mocap",
    name: "Mocap in Unreal 5.8",
    blurb:
      "Various ways to capture face and body motion capture data onto a MetaHuman or custom rig. Clean it, reuse it, ship it.",
    priceCents: INTERMEDIATE_SESSION_CENTS,
    sessionDateISO: "2026-09-02T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/Peidz5xgTV6qQa2zT2kOxw",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-09-09-intro-pcg",
    name: "Intro to PCG (Procedural Content Generation) & AI",
    blurb:
      "Scatter a believable environment with the PCG framework instead of placing every mesh by hand. Even more powerful with MCP tools.",
    priceCents: INTRO_SESSION_CENTS,
    sessionDateISO: "2026-09-09T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/12r37RLTSZiBavbpsCDHFQ",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-09-16-unity-to-unreal",
    name: "Unity to Unreal",
    blurb:
      "Thinking of making the switch? The concepts that map over, the ones that don't, and why your Prefabs are now Blueprints. Led by Whitt Sellers.",
    priceCents: INTRO_SESSION_CENTS,
    sessionDateISO: "2026-09-16T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/C2MxUYbAQyKMSY2HzsumCg",
  }),
  wednesdayCalendarItem({
    slug: "wed-2026-09-23-usd-glb-export",
    name: "Exporting UE5 to OpenUSD to GLB",
    blurb:
      "A real cross-platform export pipeline: Unreal scenes out through OpenUSD and GLB without losing what matters. Then we'll see what they look like in Godot and ThreeJS.",
    priceCents: INTERMEDIATE_SESSION_CENTS,
    sessionDateISO: "2026-09-23T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/ggxLvryiSFKKtA1Xp9enoQ",
  }),
  // Was "Apple Vision Pro Unreal Engine Masterclass — Part 1" (advanced/$200
  // tier), blurb: "The deep dive: shipping real Unreal content to Vision Pro
  // — the full pipeline, not the demo-day version." Alex asked to save that
  // topic for a future session and swap this slot for Intro to AR instead —
  // reuse the name/blurb/tier above if that masterclass gets scheduled later.
  wednesdayCalendarItem({
    slug: "wed-2026-09-30-intro-ar",
    name: "Intro to AR",
    blurb: "Android and iOS, ARCore & ARKit, plane detection, light estimation, markers & more. Led by Yu-Jun Yeh.",
    priceCents: INTRO_SESSION_CENTS,
    sessionDateISO: "2026-09-30T15:00:00Z",
    zoomRegistrationUrl: "https://us06web.zoom.us/meeting/register/XnHIYeiPTxCvS15x4aLNWw",
  }),
];

// Standing Friday drop-in office hours — not date-pinned like the Wednesday
// calendar (booking a specific Friday works like the existing single-session
// items: buyer replies with which date after checkout). Same two-hour format
// and $100 rate as the rest of the open-enrollment calendar — office hours
// isn't a discounted afterthought, it's a regular session.
export const officeHoursDropIn: StoreItem = {
  slug: "office-hours-dropin",
  name: "Live office hours — drop-in seat",
  kind: "course",
  priceCents: 10000,
  priceNote: "Every Friday, 1p ET. Book any upcoming date after checkout — no minimum headcount, this one always runs.",
  blurb: "Two live hours with Alex — bring your broken Blueprint, your pipeline question, your career fork. Small group, open floor.",
  delivery: "Tell us which Friday at checkout; order confirmation lands right away and Alex sends the Zoom link for that date.",
  fulfillment: "email-manual",
};

// Not part of the open-enrollment calendar — a lower-commitment on-ramp to
// private time than the two-hour private-1on1 below. Price is deliberately
// not shown anywhere on-site (see StoreItem.hidePrice); Stripe Checkout
// still shows and charges it normally. Excluded from promo codes for the
// same reason private-1on1 is: private time isn't the group-class discount.
export const consultationDropIn: StoreItem = {
  slug: "consultation-1hr",
  name: "1-hour consultation with Alex",
  kind: "course",
  priceCents: 20000,
  hidePrice: true,
  priceNote: "One hour, entirely on your agenda — price shown at checkout.",
  blurb:
    "One focused hour, one-on-one, on whatever you need — a project review, a stuck pipeline, career advice, scoping a build. Live over video with screen share.",
  delivery: "Pick a real open slot yourself on Alex's Zoom Scheduler — order confirmation lands right away, and the Zoom link comes straight from your booking.",
  fulfillment: "booking",
  allowPromoCodes: false,
  schedulingUrl: "https://scheduler.zoom.us/alex-coulombe/1-hour-consultation",
};

export const storeItems: StoreItem[] = [
  ...wednesdayCalendar,
  officeHoursDropIn,
  consultationDropIn,
  {
    slug: "class-voucher",
    name: "Any-class voucher — founding batch",
    kind: "course",
    priceCents: 5000,
    compareAt: [
      `Intro session ${formatPrice(INTRO_SESSION_CENTS)}`,
      `Advanced session ${formatPrice(ADVANCED_SESSION_CENTS)}`,
    ],
    priceNote:
      "Founding batch of 60 — when they're gone, they're gone. Good for any open-enrollment class (private 1:1s excluded). Newsletter subscribers get a promo code for extra off at checkout.",
    capacity: 60,
    blurb:
      "One voucher = one seat in any open-enrollment class, intro or advanced, whenever you're ready. Buy now, redeem for anything on the calendar — this month or next year. Never expires, and you can gift it.",
    delivery:
      "A unique voucher code by email, instantly. Enter it at checkout for any open-enrollment class and it comes out to $0 — no expiration, transferable, zero back-and-forth.",
    fulfillment: "email-manual",
  },
  {
    // NOT one of the 8 dated Wednesday-calendar classes above — this is any
    // topic from the 50+ full teaching catalog (/training#catalog),
    // scheduled around the buyer instead of on the public Wednesday date.
    // Keep the name/blurb explicit about that distinction; the two flows
    // look identical price-wise ($100/$200, same delivery mechanics) and
    // sit right next to each other in the storeItems list, so it's an easy
    // mix-up otherwise.
    slug: "ue-class-single",
    name: "Any intro-tier class — pick your own time",
    kind: "course",
    priceCents: INTRO_SESSION_CENTS,
    priceNote:
      "Not the Wednesday calendar above — pick any foundational topic from the full 50+ class catalog and Alex schedules it around you. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    blurb: "One live two-hour session on any foundational track from the full teaching catalog — the essentials, scheduled on your calendar, not a fixed public date.",
    delivery: "An order confirmation lands in your inbox right away; reply with which topic (from the catalog) and your availability, and Alex schedules your session (usually same day). Sessions run live over video with screen share.",
    fulfillment: "booking",
  },
  {
    // See the ue-class-single comment above — same distinction, advanced tier.
    slug: "ue-class-advanced",
    name: "Any advanced-tier class — pick your own time",
    kind: "course",
    priceCents: ADVANCED_SESSION_CENTS,
    priceNote:
      "Not the Wednesday calendar above — pick any advanced topic from the full 50+ class catalog and Alex schedules it around you. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    blurb: "One live two-hour session on any advanced or specialized track from the full teaching catalog — Lumen/Nanite deep dives, virtual production, AI for Unreal, Vision Pro, or MetaHumans — scheduled on your calendar, not a fixed public date.",
    delivery: "An order confirmation lands in your inbox right away; reply with which topic (from the catalog) and your availability, and Alex schedules your session (usually same day). Sessions run live over video with screen share.",
    fulfillment: "booking",
  },
  {
    slug: "private-1on1",
    name: "Private 1:1 session",
    kind: "course",
    priceCents: 40000,
    priceNote:
      "Two hours, just you and Alex — no group. Vouchers and promo codes don't apply to private sessions.",
    blurb:
      "Two focused hours one-on-one, entirely on your agenda: your project, your pipeline, the exact thing you're stuck on. Live over video with screen share.",
    delivery: "An order confirmation lands right away; reply with your availability and Alex books your session, usually same day.",
    fulfillment: "booking",
    allowPromoCodes: false,
  },
  {
    slug: "unreal-foundations-cohort",
    name: "Unreal Foundations — August cohort",
    kind: "course-bundle",
    priceCents: 25000,
    priceNote:
      "Early-bird through July 29 — $300 after. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    capacity: 25,
    blurb:
      "Zero to Environment in four live Wednesday classes: the editor & ecosystem, world building with Megascans & Nanite, Lumen & lighting, then cameras & Movie Render Queue — leave with a portfolio-ready render. Recordings and project files included.",
    delivery: "You get an order confirmation right away; Alex emails your Zoom links, calendar invites, and project files before the first class.",
    fulfillment: "email-manual",
    earlyBird: { untilISO: "2026-07-30T04:00:00Z", regularPriceCents: 30000 }, // Jul 29 EOD ET
    saleWindow: {
      // Paused, not deleted: the Aug 5 plan changed to a free session +
      // /training#poll to decide what this cohort actually becomes. Move
      // closesAtISO back into the future to reopen sales once it's scheduled.
      closesAtISO: "2026-08-02T00:00:00Z",
      // Undated on purpose — this note has no expiry of its own, so naming a
      // day that's already passed is the one thing it can't do.
      closedNote: "Paused while the poll settles what these weeks actually cover — back soon.",
      closedList: "unreal",
    },
  },
  {
    slug: "ue-curriculum-bundle",
    name: "Unreal Engine curriculum bundle",
    kind: "course-bundle",
    priceCents: 90000,
    blurb: "The full track: all eleven classes, scheduled at your pace, with homework review between sessions.",
    delivery: "An order confirmation lands right away; Alex then reaches out to schedule all 11 sessions at your pace and share class materials + project files.",
    fulfillment: "booking",
  },
  {
    slug: "team-training",
    name: "Team / studio training",
    kind: "course-bundle",
    priceCents: null,
    priceNote: "scoped per team",
    list: "team-training",
    blurb:
      "Custom curriculum bundled from 50+ ready-to-teach classes — your project, your pipeline, your sharp edges. Pricing varies with team size and scope.",
    delivery: "Scoping call first; training delivered live, on-site or remote.",
    fulfillment: "email-manual",
  },
  {
    slug: "skill-ue5-testflight",
    name: "ue5-testflight (Claude Code skill)",
    kind: "skill",
    priceCents: 2900,
    externalUrl: "https://capafy.ai/product/ue5-testflight",
    blurb: "The autonomous UE5 → TestFlight pipeline as an installable skill.",
    delivery: "Delivered instantly on Capafy — install straight into Claude Code after purchase.",
    fulfillment: "download-link",
  },
  {
    slug: "skill-ios-testflight",
    name: "ios-testflight (Claude Code skill)",
    kind: "skill",
    priceCents: 2900,
    externalUrl: "https://capafy.ai/product/ios-testflight",
    blurb: "Archive + upload iOS/visionOS/macOS Xcode projects to TestFlight via CLI, with every signing gotcha documented.",
    delivery: "Delivered instantly on Capafy — install straight into Claude Code after purchase.",
    fulfillment: "download-link",
  },
  {
    slug: "pinchwork-template",
    name: "Pinchwork — OpenXR hand-tracking template",
    kind: "template",
    priceCents: null,
    priceNote: "pre-launch",
    blurb: "The universal OpenXR hand-tracking template for Unreal. Join the early-access list — launch pricing announced with the release.",
    delivery: "Early access via GitHub invite when it ships.",
    fulfillment: "github-invite",
  },
  {
    // NOTE: lib/commerce/products.ts deliberately has NO entry for this yet
    // (it isn't a real product). If it ever ships as an instant-download SKU
    // there, remove this notify-only entry in the same commit.
    slug: "unrealitykit-early",
    name: "UnRealityKit Bridge — coming soon",
    kind: "repo-access",
    priceCents: null,
    priceNote: "not released yet",
    blurb: "UE simulation + RealityKit rendering for visionOS. Still in the lab — not a product yet. Subscribe and you'll be the first to know the moment it's available.",
    delivery: "No purchase — just drop your email and you'll get the launch announcement before anyone else.",
    fulfillment: "github-invite",
    ctaLabel: "Notify me at launch →",
    list: "unrealitykit-bridge",
  },
  {
    // Notify-only until the EULA and license-key delivery are real. Like
    // unrealitykit-early, lib/commerce/products.ts deliberately has no entry —
    // add one there in the same commit if this ever becomes a paid download.
    slug: "receipt-reconciler",
    name: "Receipt Reconciler — coming soon",
    kind: "template",
    priceCents: null,
    priceNote: "not released yet",
    blurb:
      "Reconcile a year of card statements against the receipts buried in your inbox. Finds the matching email or photo receipt, reads the total with on-device OCR, and writes it back to your spreadsheet — with a local review UI for everything it isn't sure about. macOS, runs entirely on your machine.",
    delivery: "No purchase yet — drop your email and you'll hear the moment it's for sale.",
    fulfillment: "download-link",
    ctaLabel: "Notify me at launch →",
    list: "receipt-reconciler",
  },
];

export function formatPrice(cents: number | null, note?: string): string {
  if (cents === null) return note ?? "inquire";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// The REAL price right now — steps to earlyBird.regularPriceCents once its
// cutoff passes. Both the store page and the checkout API call this instead
// of reading item.priceCents directly, so a stale early-bird price can never
// actually be charged past its own cutoff.
export function effectivePriceCents(item: StoreItem, now: Date = new Date()): number | null {
  if (item.priceCents === null) return null;
  if (item.earlyBird && now >= new Date(item.earlyBird.untilISO)) {
    return item.earlyBird.regularPriceCents;
  }
  return item.priceCents;
}

// False once saleWindow.closesAtISO has passed — the one real-world case
// today is a cohort whose first class already happened. Checked server-side
// in /api/checkout so a purchase can't complete even if the marketing page
// hasn't re-rendered since the cutoff.
export function isPurchasable(item: StoreItem, now: Date = new Date()): boolean {
  if (item.priceCents === null || item.externalUrl) return false;
  if (item.saleWindow && now >= new Date(item.saleWindow.closesAtISO)) return false;
  return true;
}
