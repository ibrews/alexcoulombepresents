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
};

export const STORE_LIVE = process.env.NEXT_PUBLIC_STORE_LIVE === "1";

// The base price for open-enrollment sessions — single source of truth so
// the voucher's crossed-out comparison prices can never drift from the
// actual per-session prices below.
const INTRO_SESSION_CENTS = 9900;
const ADVANCED_SESSION_CENTS = 20000;

export const storeItems: StoreItem[] = [
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
    blurb:
      "One voucher = one seat in any open-enrollment class, intro or advanced, whenever you're ready. Buy now, redeem for anything on the calendar — this month or next year. Never expires, and you can gift it.",
    delivery:
      "A unique voucher code by email, instantly. Enter it at checkout for any open-enrollment class and it comes out to $0 — no expiration, transferable, zero back-and-forth.",
    fulfillment: "email-manual",
  },
  {
    slug: "ue-class-single",
    name: "Unreal Engine class — intro session",
    kind: "course",
    priceCents: INTRO_SESSION_CENTS,
    priceNote:
      "A core/foundational track. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    blurb: "One live two-hour session on a foundational Unreal track — the essentials, in a small open-enrollment group.",
    delivery: "An order confirmation lands in your inbox right away; reply with your availability and Alex schedules your session (usually same day). Sessions run live over video with screen share.",
    fulfillment: "booking",
  },
  {
    slug: "ue-class-advanced",
    name: "Unreal Engine class — advanced session",
    kind: "course",
    priceCents: ADVANCED_SESSION_CENTS,
    priceNote:
      "A specialized/advanced track. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    blurb: "One live two-hour session on an advanced or specialized track — Lumen/Nanite deep dives, virtual production, AI for Unreal, Vision Pro, or MetaHumans. Open enrollment, small group.",
    delivery: "An order confirmation lands in your inbox right away; reply with your availability and Alex schedules your session (usually same day). Sessions run live over video with screen share.",
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
    priceCents: 24900,
    priceNote:
      "Early-bird through July 29 — $299 after. Student or between jobs? Email for a sliding-scale seat — no questions asked.",
    blurb:
      "Zero to Environment in four live Wednesday classes starting Aug 5: the editor & ecosystem, world building with Megascans & Nanite, Lumen & lighting, then cameras & Movie Render Queue — leave with a portfolio-ready render. Every class runs twice (10a & 12:30p ET) plus Thursday office hours, and recordings are included.",
    delivery: "You get an order confirmation right away; Alex emails your Zoom links, calendar invites, and project files before the first class on Aug 5 (recordings after each).",
    fulfillment: "email-manual",
    earlyBird: { untilISO: "2026-07-30T04:00:00Z", regularPriceCents: 29900 }, // Jul 29 EOD ET
    saleWindow: {
      closesAtISO: "2026-08-05T14:00:00Z", // first session, 10am ET
      closedNote: "This cohort has already started — join the list for the next one.",
      closedList: "unreal",
    },
  },
  {
    slug: "ue-curriculum-bundle",
    name: "Unreal Engine curriculum bundle",
    kind: "course-bundle",
    priceCents: 89900,
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
