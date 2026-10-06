// ── Gifting — input validation, Stripe params, webhook metadata ─────────────
// "People should be able to gift anything, including classes and
// memberships" (Alex, 2026-10-06). The buyer pays through the normal Stripe
// Checkout; the gift rides along as session metadata, and the webhook
// fulfills the RECIPIENT instead of the buyer (lib/commerce/giftFulfillment.ts).
//
// Pure on purpose: everything the checkout route and webhook need to agree on
// (field names, limits, prices) lives here and is unit-tested. The only
// runtime imports are lib/email.ts and lib/store.ts, both dependency-free.

import { isValidEmail } from "../email.ts";
import { consultationDropIn, officeHoursDropIn, type StoreItem } from "../store.ts";
import type { MembershipTierId } from "./membershipBilling";

export type GiftInfo = {
  recipientEmail: string;
  recipientName: string | null;
  fromName: string | null;
  message: string | null;
};

export const GIFT_MESSAGE_MAX = 400;
export const GIFT_NAME_MAX = 100;
// Stripe rejects any metadata value over 500 characters.
const STRIPE_METADATA_VALUE_MAX = 500;

export const VOUCHER_SLUG = "class-voucher";

// Every C0/C1 control character. The message keeps its line breaks (people
// write notes in paragraphs); names keep nothing, since they also land in
// email subject lines.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned || null;
}

export type GiftValidation = { ok: true; gift: GiftInfo } | { ok: false; error: string };

/** Validates and normalizes the `gift` object a checkout request carries. */
export function validateGift(raw: unknown): GiftValidation {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Gift details are missing." };
  const r = raw as Record<string, unknown>;
  const recipientEmail = typeof r.recipientEmail === "string" ? r.recipientEmail.trim() : "";
  if (!recipientEmail || !isValidEmail(recipientEmail) || recipientEmail.length > 254) {
    return { ok: false, error: "Enter a valid email address for the gift recipient." };
  }
  const recipientName = cleanName(r.recipientName);
  const fromName = cleanName(r.fromName);
  if ((recipientName?.length ?? 0) > GIFT_NAME_MAX || (fromName?.length ?? 0) > GIFT_NAME_MAX) {
    return { ok: false, error: `Names must be ${GIFT_NAME_MAX} characters or fewer.` };
  }
  const message = cleanMessage(r.message);
  if ((message?.length ?? 0) > GIFT_MESSAGE_MAX) {
    return { ok: false, error: `The gift message must be ${GIFT_MESSAGE_MAX} characters or fewer.` };
  }
  return { ok: true, gift: { recipientEmail, recipientName, fromName, message } };
}

/** The gift as Stripe Checkout `metadata[...]` form params. */
export function giftMetadataParams(gift: GiftInfo): Record<string, string> {
  const params: Record<string, string> = {
    "metadata[gift]": "1",
    "metadata[gift_recipient_email]": gift.recipientEmail,
  };
  const optional: [string, string | null][] = [
    ["gift_recipient_name", gift.recipientName],
    ["gift_from_name", gift.fromName],
    ["gift_message", gift.message],
  ];
  for (const [key, value] of optional) {
    if (value) params[`metadata[${key}]`] = value.slice(0, STRIPE_METADATA_VALUE_MAX);
  }
  return params;
}

/** Reads the gift back off a completed session's metadata — null when the
 * session isn't a gift, which is what keeps every non-gift path untouched. */
export function parseGiftMetadata(metadata: Record<string, unknown> | null | undefined): GiftInfo | null {
  if (!metadata || typeof metadata.gift_recipient_email !== "string") return null;
  const parsed = validateGift({
    recipientEmail: metadata.gift_recipient_email,
    recipientName: metadata.gift_recipient_name,
    fromName: metadata.gift_from_name,
    message: metadata.gift_message,
  });
  return parsed.ok ? parsed.gift : null;
}

// ── Store items ─────────────────────────────────────────────────────────────

const GIFTABLE_SLUGS = new Set([officeHoursDropIn.slug, consultationDropIn.slug, VOUCHER_SLUG]);

/** Dated classes, office hours, the consultation, and the class voucher. */
export function isGiftable(item: Pick<StoreItem, "slug" | "sessionDateISO">): boolean {
  return Boolean(item.sessionDateISO) || GIFTABLE_SLUGS.has(item.slug);
}

/**
 * Turns an already-built store checkout into a gift checkout, in place. The
 * buyer still pays the same price for the same item; what changes is the
 * line-item name (so the receipt says it was a gift), the success page, the
 * metadata the webhook routes on, and office hours' "which Friday?" field,
 * which a giver often can't answer.
 */
export function applyGiftToStoreCheckout(
  params: Record<string, string>,
  input: { site: string; item: Pick<StoreItem, "slug" | "name" | "blurb">; gift: GiftInfo }
): void {
  const { site, item, gift } = input;
  const recipient = gift.recipientName ?? gift.recipientEmail;
  params.success_url = `${site}/store/success?item=${item.slug}&gift=1&session_id={CHECKOUT_SESSION_ID}`;
  params["line_items[0][price_data][product_data][name]"] = `Gift: ${item.name}`;
  params["line_items[0][price_data][product_data][description]"] = `A gift for ${recipient}. ${item.blurb}`.slice(0, 500);
  if (item.slug === officeHoursDropIn.slug) {
    params["custom_fields[0][label][custom]"] = "Which Friday? (blank = they'll pick)";
    params["custom_fields[0][optional]"] = "true";
  }
  Object.assign(params, giftMetadataParams(gift));
}

// ── Gift memberships ────────────────────────────────────────────────────────

export const GIFT_MEMBERSHIP_KIND = "gift-membership";
export const GIFT_MEMBERSHIP_TERMS = [1, 3] as const;
export type GiftMembershipTerm = (typeof GIFT_MEMBERSHIP_TERMS)[number];

export function isGiftMembershipTerm(value: unknown): value is GiftMembershipTerm {
  return GIFT_MEMBERSHIP_TERMS.includes(value as GiftMembershipTerm);
}

export type GiftTier = { id: MembershipTierId; name: string; priceCents: number };

/** The tier's monthly price times the term. No gift discount, by design. */
export function giftMembershipPriceCents(tier: GiftTier, months: GiftMembershipTerm): number {
  return tier.priceCents * months;
}

export function giftMembershipLabel(tier: Pick<GiftTier, "name">, months: number): string {
  return `${months}-month ${tier.name} membership`;
}

/**
 * A fixed-term gift is a one-time payment (mode=payment, inline price_data),
 * NOT a subscription: nothing renews, nobody's card is charged again, and the
 * recipient never needs a Stripe customer of their own.
 */
export function giftMembershipCheckoutParams(input: {
  site: string;
  tier: GiftTier;
  months: GiftMembershipTerm;
  gift: GiftInfo;
}): Record<string, string> {
  const { site, tier, months, gift } = input;
  const recipient = gift.recipientName ?? gift.recipientEmail;
  return {
    mode: "payment",
    success_url: `${site}/gift?sent=membership`,
    cancel_url: `${site}/gift`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(giftMembershipPriceCents(tier, months)),
    "line_items[0][price_data][product_data][name]": `Gift: ${tier.name} membership, ${months} month${months === 1 ? "" : "s"}`,
    "line_items[0][price_data][product_data][description]":
      `A ${giftMembershipLabel(tier, months)} for ${recipient}. One-time payment; nothing renews.`.slice(0, 500),
    "metadata[kind]": GIFT_MEMBERSHIP_KIND,
    "metadata[tier]": tier.id,
    "metadata[months]": String(months),
    "automatic_tax[enabled]": "false", // TODO(alex): flip on after Stripe Tax setup
    // Off on purpose: the $250 class-voucher coupon (and any other code) is
    // meant for classes, and would otherwise zero out a gifted membership.
    allow_promotion_codes: "false",
    ...giftMetadataParams(gift),
  };
}

export function parseGiftMembershipMetadata(
  metadata: Record<string, unknown> | null | undefined
): { tierId: MembershipTierId; months: GiftMembershipTerm } | null {
  if (!metadata || metadata.kind !== GIFT_MEMBERSHIP_KIND) return null;
  const tierId = metadata.tier;
  const months = Number(metadata.months);
  if (tierId !== "starter" && tierId !== "unlimited" && tierId !== "insider") return null;
  if (!isGiftMembershipTerm(months)) return null;
  return { tierId, months };
}

/** What the recipient already holds, from a read-only lookup by email. */
export type RecipientMembership = {
  tier: string;
  updatesUntil: Date | null;
  grantSource: string | null;
  stripeCustomerId: string | null;
};

export const GIFT_MEMBERSHIP_REFUSAL =
  "Good news: they already have an active membership, so a membership gift can't stack on top of it. " +
  "A class makes a great gift instead: pick one at alexcoulombepresents.com/gift.";

/**
 * Refuse a membership gift the recipient couldn't use: a live membership that
 * a Stripe subscription is paying for (the gift would just sit under a
 * subscription that keeps billing), or a lifetime membership (nothing to add).
 * A live fixed-term comp/gift is fine — the new gift merges into it.
 */
export function giftMembershipRefusal(existing: RecipientMembership[]): string | null {
  const blocked = existing.some(
    (m) => m.updatesUntil === null || (m.grantSource === null && m.stripeCustomerId !== null)
  );
  return blocked ? GIFT_MEMBERSHIP_REFUSAL : null;
}
