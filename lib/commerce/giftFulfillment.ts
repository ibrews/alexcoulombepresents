// ── Gift fulfillment — webhook orchestration ────────────────────────────────
// When a checkout.session.completed carries gift metadata, the RECIPIENT is
// the customer: the order is recorded against them (so seat counts,
// class-materials access and the daily Drive sync see them), they get the
// confirmation and the Zoom registration, and the buyer gets a short "your
// gift was sent" note instead. Same idempotency shape as the non-gift
// branches in app/api/stripe-webhook: dedupe first, do the (idempotent) work,
// record the order LAST so a mid-flight failure → 500 → Stripe retry re-runs
// the work instead of skipping it.
//
// No runtime imports beyond other pure modules: every side effect arrives via
// deps, so the recipient-vs-buyer routing is unit-tested with fakes.

import type { MembershipTierId } from "./membershipBilling";
import { giftMembershipLabel, type GiftInfo } from "./gifts.ts";
import { addMonthsUTC, type MembershipGrantResult } from "./membershipGrants.ts";
import { giftPhrase, type GiftedItemInfo } from "./giftEmailCopy.ts";

type Person = { email: string; name: string | null };

type RecordOrder = (input: {
  stripeEventId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  sku: string;
  email: string;
  name?: string | null;
  amountCents: number;
}) => Promise<void>;

type SendBuyerConfirmation = (input: {
  email: string;
  buyerName: string | null;
  recipientEmail: string;
  recipientName: string | null;
  giftDescription: string;
  amountCents: number;
}) => Promise<void>;

async function bestEffort(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[gift] ${label} failed`, err);
  }
}

// ── Store items: class seats, office hours, consultation, voucher ───────────

export type CatalogGiftItem = GiftedItemInfo & {
  minEnrollment?: number;
  zoomMeetingId?: string;
  isWednesdayClass: boolean;
};

export type CatalogGiftInput = {
  eventId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountCents: number;
  buyer: Person;
  gift: GiftInfo;
  item: CatalogGiftItem;
  bookingNote?: string | null;
};

export type CatalogGiftDeps = {
  checkoutSessionProcessed(eventId: string, sessionId: string): Promise<boolean>;
  recordCheckoutSession: RecordOrder;
  getSeatsSold(slug: string): Promise<number>;
  createVoucherCode(input: { buyerEmail: string; stripeSessionId: string }): Promise<string>;
  sendGiftedVoucherEmail(input: {
    email: string;
    recipientName: string | null;
    fromName: string | null;
    message: string | null;
    code: string;
  }): Promise<void>;
  sendGiftedItemEmail(input: {
    email: string;
    recipientName: string | null;
    fromName: string | null;
    message: string | null;
    item: GiftedItemInfo;
    bookingNote: string | null;
    underMinimum: { seatsSold: number; minEnrollment: number } | null;
  }): Promise<void>;
  sendGiftBuyerConfirmation: SendBuyerConfirmation;
  sendOwnerAlert(input: { subject: string; body: string }): Promise<void>;
  addZoomRegistrant(meetingId: string, person: { email: string; name?: string | null }): Promise<boolean>;
  grantClassDriveAccess(slug: string, email: string): Promise<void>;
  sendTelegramNotice(text: string): Promise<void>;
};

export type GiftFulfillmentResult = { deduped: true } | { deduped: false; action: string };

export async function fulfillCatalogGift(input: CatalogGiftInput, deps: CatalogGiftDeps): Promise<GiftFulfillmentResult> {
  const { gift, item, buyer } = input;
  if (await deps.checkoutSessionProcessed(input.eventId, input.sessionId)) return { deduped: true };

  const recipient: Person = { email: gift.recipientEmail, name: gift.recipientName };
  // The name the recipient sees: what the buyer typed, else Stripe's
  // cardholder name, so the email never says "Someone gave you…" when we know.
  const fromName = gift.fromName ?? buyer.name;
  const description = giftPhrase(item);
  const dollars = (input.amountCents / 100).toFixed(2);

  // The recipient's email is the one that must land (it carries the voucher
  // code / Zoom link), so it throws → 500 → Stripe retries. The buyer's note
  // and the owner alert are best-effort: failing them would make a retry
  // re-send the recipient's email for no gain.
  let seatsSold: number | undefined;
  if (item.isVoucher) {
    const code = await deps.createVoucherCode({ buyerEmail: buyer.email, stripeSessionId: input.sessionId });
    await deps.sendGiftedVoucherEmail({
      email: recipient.email,
      recipientName: recipient.name,
      fromName,
      message: gift.message,
      code,
    });
    console.log(`[gift] voucher ${code} → ${recipient.email} (from ${buyer.email})`);
  } else {
    if (item.sessionDateISO && item.minEnrollment !== undefined) {
      try {
        seatsSold = await deps.getSeatsSold(item.slug);
      } catch (err) {
        console.error("[gift] seat count failed", err);
      }
    }
    await deps.sendGiftedItemEmail({
      email: recipient.email,
      recipientName: recipient.name,
      fromName,
      message: gift.message,
      item,
      bookingNote: input.bookingNote ?? null,
      underMinimum:
        seatsSold !== undefined && item.minEnrollment !== undefined && seatsSold < item.minEnrollment
          ? { seatsSold, minEnrollment: item.minEnrollment }
          : null,
    });
    await bestEffort("owner alert", () =>
      deps.sendOwnerAlert({
        subject: `FULFILL (GIFT): ${item.name} — $${dollars} from ${buyer.name ?? buyer.email} for ${recipient.name ?? recipient.email}`,
        body: [
          `Item: ${item.name} (${item.slug})`,
          `Recipient: ${recipient.name ?? "—"} <${recipient.email}>`,
          `Bought by: ${buyer.name ?? "—"} <${buyer.email}>`,
          `Amount: $${dollars}`,
          ...(input.bookingNote ? [`Booking note: ${input.bookingNote}`] : []),
          ...(gift.message ? ["", "Their note:", gift.message] : []),
          `Stripe session: ${input.sessionId}`,
          "",
          "The RECIPIENT got the confirmation and is the one to follow up with",
          "(Zoom link / scheduling). The buyer only got a 'your gift was sent' note.",
        ].join("\n"),
      })
    );
  }

  await bestEffort("buyer confirmation", () =>
    deps.sendGiftBuyerConfirmation({
      email: buyer.email,
      buyerName: buyer.name,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      giftDescription: description,
      amountCents: input.amountCents,
    })
  );

  await deps.recordCheckoutSession({
    stripeEventId: input.eventId,
    stripeSessionId: input.sessionId,
    stripePaymentIntentId: input.paymentIntentId,
    sku: item.slug,
    email: recipient.email,
    name: recipient.name,
    amountCents: input.amountCents,
  });

  if (!item.isVoucher) {
    // Same best-effort extras as a regular class purchase, pointed at the
    // recipient: the Zoom registrant and the class's Drive folder.
    if (item.zoomMeetingId) {
      const zoomMeetingId = item.zoomMeetingId;
      await bestEffort("zoom registration", () => deps.addZoomRegistrant(zoomMeetingId, recipient));
    }
    await bestEffort("drive grant", () => deps.grantClassDriveAccess(item.slug, recipient.email));
    if (item.isWednesdayClass) {
      await bestEffort("telegram notice", () =>
        deps.sendTelegramNotice(
          `🎁 ${buyer.name ?? buyer.email} gifted ${recipient.name ?? recipient.email} a seat in "${item.name}" — ${seatsSold ?? "?"} signed up so far.`
        )
      );
    }
  }

  return { deduped: false, action: `gifted ${item.slug} → ${recipient.email}` };
}

// ── Gift memberships ────────────────────────────────────────────────────────

export type GiftMembershipInput = {
  eventId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountCents: number;
  /** When the checkout session was created. The gift's end date derives from
   * this, not from "now", so a webhook retry lands on the same date and the
   * credit top-up (keyed on that date) never double-mints. */
  createdAt: Date;
  buyer: Person;
  gift: GiftInfo;
  tier: { id: MembershipTierId; name: string; monthlyCredits: number | "unlimited" };
  months: number;
};

export type GiftMembershipDeps = {
  checkoutSessionProcessed(eventId: string, sessionId: string): Promise<boolean>;
  recordCheckoutSession: RecordOrder;
  findOrCreateCustomer(email: string, name?: string | null): Promise<number>;
  grantCompMembership(
    customerId: number,
    tier: MembershipTierId,
    until: Date | null,
    source: "comp" | "gift"
  ): Promise<MembershipGrantResult>;
  mintBookingCredits(customerId: number, count: number, expiresAt: Date): Promise<number>;
  linkMembershipCycleToOrder(customerId: number, orderSessionId: string, expiresAt: Date): Promise<void>;
  issueMagicLinkUrl(customerId: number): Promise<string>;
  sendGiftedMembershipEmail(input: {
    email: string;
    recipientName: string | null;
    tierId: MembershipTierId;
    until: Date | null;
    months: number;
    credits: number;
    fromName: string | null;
    message: string | null;
    magicLinkUrl: string;
  }): Promise<void>;
  sendGiftBuyerConfirmation: SendBuyerConfirmation;
  sendOwnerAlert(input: { subject: string; body: string }): Promise<void>;
  sendTelegramNotice(text: string): Promise<void>;
  /** Optional, like the membership webhook's: absent when Zoom isn't set up. */
  inviteToUpcomingSessions?(email: string): Promise<unknown>;
};

export const GIFT_MEMBERSHIP_SKU = "gift-membership";

export async function fulfillGiftMembership(
  input: GiftMembershipInput,
  deps: GiftMembershipDeps
): Promise<GiftFulfillmentResult> {
  if (await deps.checkoutSessionProcessed(input.eventId, input.sessionId)) return { deduped: true };

  const { gift, tier, buyer, months } = input;
  const recipient: Person = { email: gift.recipientEmail, name: gift.recipientName };
  const until = addMonthsUTC(input.createdAt, months);

  const customerId = await deps.findOrCreateCustomer(recipient.email, recipient.name);
  const grant = await deps.grantCompMembership(customerId, tier.id, until, "gift");
  // Starter is the credit-based tier: a gift of it gets the whole term's
  // credits up front, all expiring with the gift (Unlimited/Insider never
  // touch credits). mintBookingCredits tops up to the count keyed on the
  // expiry, so a retry can't double-mint.
  const credits = tier.monthlyCredits === "unlimited" ? 0 : tier.monthlyCredits * months;
  if (credits > 0) await deps.mintBookingCredits(customerId, credits, until);

  const fromName = gift.fromName ?? buyer.name;
  const magicLinkUrl = await deps.issueMagicLinkUrl(customerId);
  await deps.sendGiftedMembershipEmail({
    email: recipient.email,
    recipientName: recipient.name,
    tierId: tier.id,
    until: grant.plan.until,
    months,
    credits,
    fromName,
    message: gift.message,
    magicLinkUrl,
  });

  const description = `a ${giftMembershipLabel(tier, months)}`;
  await bestEffort("buyer confirmation", () =>
    deps.sendGiftBuyerConfirmation({
      email: buyer.email,
      buyerName: buyer.name,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      giftDescription: description,
      amountCents: input.amountCents,
    })
  );

  await deps.recordCheckoutSession({
    stripeEventId: input.eventId,
    stripeSessionId: input.sessionId,
    stripePaymentIntentId: input.paymentIntentId,
    sku: GIFT_MEMBERSHIP_SKU,
    email: recipient.email,
    name: recipient.name,
    amountCents: input.amountCents,
  });
  // Ties the gift's entitlements (credits, and the membership row when this
  // gift set its end date) to the order, so a full refund through the
  // existing charge.refunded branch takes the gift back.
  await deps.linkMembershipCycleToOrder(customerId, input.sessionId, until);

  if (deps.inviteToUpcomingSessions) {
    const invite = deps.inviteToUpcomingSessions;
    await bestEffort("upcoming-session invites", () => invite(recipient.email));
  }

  const dollars = (input.amountCents / 100).toFixed(2);
  const addedNothing = grant.plan.action === "unchanged";
  await bestEffort("owner alert", () =>
    deps.sendOwnerAlert({
      subject: `${addedNothing ? "CHECK: " : ""}Gift membership: ${description} for ${recipient.name ?? recipient.email} — $${dollars}`,
      body: [
        `Recipient: ${recipient.name ?? "—"} <${recipient.email}>`,
        `Bought by: ${buyer.name ?? "—"} <${buyer.email}>`,
        `Gift: ${description}, through ${until.toISOString().slice(0, 10)}${credits > 0 ? ` + ${credits} class credits` : ""}`,
        `Result: ${grant.plan.action}${grant.plan.keptHigherTier ? " (kept their higher tier)" : ""}${grant.plan.keptLongerDate ? " (kept their later end date)" : ""}`,
        ...(addedNothing
          ? ["", "They already held this or better, so the gift added nothing. Consider a refund or a class instead."]
          : []),
        ...(gift.message ? ["", "Their note:", gift.message] : []),
        `Stripe session: ${input.sessionId}`,
      ].join("\n"),
    })
  );
  await bestEffort("telegram notice", () =>
    deps.sendTelegramNotice(`🎁 ${buyer.name ?? buyer.email} gifted ${recipient.name ?? recipient.email} ${description}.`)
  );

  return { deduped: false, action: `gift ${tier.id} ${months}mo → ${recipient.email} (${grant.plan.action})` };
}
