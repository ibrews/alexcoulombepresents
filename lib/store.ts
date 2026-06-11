// ── Store catalog — direct sales, no middleman ──────────────────────────────
//
// PAYMENTS MODEL
// Checkout runs through Stripe Checkout (created server-side in
// app/api/checkout/route.ts). Stripe is a PROCESSOR, not a marketplace:
// the only cut anyone takes is card processing (~2.9% + 30¢; ACH/Link is
// cheaper). No platform commission, ever. For true zero-fee purchases every
// item also exposes an "invoice me" path (ACH/Zelle/check via email).
//
// PRICING — every price below is a PLACEHOLDER until STORE_LIVE flips on.
// TODO(alex): set real prices, then set NEXT_PUBLIC_STORE_LIVE=1 in Vercel.
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
  blurb: string;
  delivery: string; // what the buyer receives, in plain words
  fulfillment: "email-manual" | "github-invite" | "download-link" | "booking";
};

export const STORE_LIVE = process.env.NEXT_PUBLIC_STORE_LIVE === "1";

export const storeItems: StoreItem[] = [
  {
    slug: "ue-class-single",
    name: "Unreal Engine class — single session",
    kind: "course",
    priceCents: 14900, // TODO(alex): real price
    blurb: "One live two-hour session from the curriculum — pick any track, from Intro to AI for Unreal.",
    delivery: "A booking link arrives by email after checkout; sessions run live over video with screen share.",
    fulfillment: "booking",
  },
  {
    slug: "ue-curriculum-bundle",
    name: "Unreal Engine curriculum bundle",
    kind: "course-bundle",
    priceCents: 99900, // TODO(alex): real price
    blurb: "The full track: all eleven classes, scheduled at your pace, with homework review between sessions.",
    delivery: "Booking access to all 11 sessions + class materials and project files.",
    fulfillment: "booking",
  },
  {
    slug: "team-training",
    name: "Team / studio training",
    kind: "course-bundle",
    priceCents: null,
    priceNote: "scoped per team",
    blurb: "Custom curriculum for your studio — your project, your pipeline, your sharp edges.",
    delivery: "Scoping call first; training delivered live, on-site or remote.",
    fulfillment: "email-manual",
  },
  {
    slug: "skill-ue5-testflight",
    name: "ue5-testflight (Claude Code skill)",
    kind: "skill",
    priceCents: 2900, // TODO(alex): match Capafy price
    blurb: "The autonomous UE5 → TestFlight pipeline as an installable skill. Also on Capafy — buying here is the same product, zero marketplace cut.",
    delivery: "Download link + install instructions delivered on the success page and by email.",
    fulfillment: "download-link",
  },
  {
    slug: "skill-ios-testflight",
    name: "ios-testflight (Claude Code skill)",
    kind: "skill",
    priceCents: 2900, // TODO(alex): match Capafy price
    blurb: "Archive + upload iOS/visionOS/macOS Xcode projects to TestFlight via CLI, with every signing gotcha documented.",
    delivery: "Download link + install instructions delivered on the success page and by email.",
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
    slug: "unrealitykit-early",
    name: "UnRealityKit Bridge — early collaborator access",
    kind: "repo-access",
    priceCents: null,
    priceNote: "Epic-linked accounts only",
    blurb: "UE simulation + RealityKit rendering for visionOS. Private per Epic's UE source policy — access is an invite, not a checkout.",
    delivery: "GitHub collaborator invite after Epic-account verification.",
    fulfillment: "github-invite",
  },
];

export function formatPrice(cents: number | null, note?: string): string {
  if (cents === null) return note ?? "inquire";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
