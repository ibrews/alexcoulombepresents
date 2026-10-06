// ── Gift tests ──────────────────────────────────────────────────────────────
// Checkout param building (gifts.ts) and webhook fulfillment routing
// (giftFulfillment.ts) against fake deps — no Stripe, no database, no email.
// The routing tests' one job: the RECIPIENT is fulfilled, the BUYER is only
// told the gift went out.
//
//   npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GIFT_MESSAGE_MAX,
  GIFT_MEMBERSHIP_REFUSAL,
  applyGiftToStoreCheckout,
  giftMembershipCheckoutParams,
  giftMembershipRefusal,
  giftMetadataParams,
  isGiftable,
  parseGiftMembershipMetadata,
  parseGiftMetadata,
  validateGift,
  type GiftInfo,
} from "../lib/commerce/gifts.ts";
import {
  fulfillCatalogGift,
  fulfillGiftMembership,
  GIFT_MEMBERSHIP_SKU,
  type CatalogGiftDeps,
  type CatalogGiftItem,
  type GiftMembershipDeps,
} from "../lib/commerce/giftFulfillment.ts";
import { applyMembershipGrant, type ExistingMembership } from "../lib/commerce/membershipGrants.ts";
import { storeItems, officeHoursDropIn } from "../lib/store.ts";

const SITE = "https://example.test";
const GIFT: GiftInfo = {
  recipientEmail: "recipient@example.com",
  recipientName: "Rae Cipient",
  fromName: "Bea Buyer",
  message: "Happy birthday!",
};
const BUYER = { email: "buyer@example.com", name: "Bea Buyer" };

// ── Validation ──────────────────────────────────────────────────────────────

test("validateGift requires a real recipient email", () => {
  assert.equal(validateGift({ recipientEmail: "not-an-email" }).ok, false);
  assert.equal(validateGift({}).ok, false);
  assert.equal(validateGift(null).ok, false);
  const ok = validateGift({ recipientEmail: "  someone@example.com " });
  assert.ok(ok.ok && ok.gift.recipientEmail === "someone@example.com");
});

test("validateGift caps the message at 400 characters", () => {
  assert.equal(validateGift({ recipientEmail: "a@b.co", message: "x".repeat(GIFT_MESSAGE_MAX) }).ok, true);
  const tooLong = validateGift({ recipientEmail: "a@b.co", message: "x".repeat(GIFT_MESSAGE_MAX + 1) });
  assert.equal(tooLong.ok, false);
  assert.match(!tooLong.ok ? tooLong.error : "", /400/);
});

test("validateGift strips control characters, keeping the message's line breaks", () => {
  const v = validateGift({
    recipientEmail: "a@b.co",
    recipientName: "Rae\r\nBcc: evil@example.com\u0000",
    fromName: "\u0007Bea\u001b[31m",
    message: "Line one\r\nLine two\u0000\u0008\n\n\n\nLine three\u009b",
  });
  assert.ok(v.ok);
  if (!v.ok) return;
  assert.equal(v.gift.recipientName, "Rae Bcc: evil@example.com", "no newline survives into a name (subject lines)");
  assert.equal(v.gift.fromName, "Bea[31m");
  assert.equal(v.gift.message, "Line one\nLine two\n\nLine three");
});

// ── Metadata ────────────────────────────────────────────────────────────────

test("gift metadata round-trips through Stripe session metadata, every value ≤ 500 chars", () => {
  const params = giftMetadataParams(GIFT);
  for (const value of Object.values(params)) assert.ok(value.length <= 500);
  const metadata = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k.replace(/^metadata\[(.*)\]$/, "$1"), v])
  );
  assert.deepEqual(parseGiftMetadata(metadata), GIFT);
});

test("no gift metadata → null, so non-gift sessions are untouched", () => {
  assert.equal(parseGiftMetadata({ slug: "class-voucher", fulfillment: "email-manual" }), null);
  assert.equal(parseGiftMetadata(undefined), null);
});

// ── Store item checkout ─────────────────────────────────────────────────────

test("giftable: dated classes, office hours, the consultation, the voucher — not everything", () => {
  assert.equal(isGiftable({ slug: "anything", sessionDateISO: "2026-11-04T16:00:00Z" }), true);
  assert.equal(isGiftable(officeHoursDropIn), true);
  assert.equal(isGiftable({ slug: "consultation-1hr" }), true);
  assert.equal(isGiftable({ slug: "class-voucher" }), true);
  assert.equal(isGiftable({ slug: "private-1on1" }), false);
  assert.equal(isGiftable({ slug: "skill-ue5-testflight" }), false);
});

test("a gift store checkout keeps the price, says Gift on the receipt, and carries the recipient", () => {
  const voucher = storeItems.find((i) => i.slug === "class-voucher")!;
  const params: Record<string, string> = {
    mode: "payment",
    success_url: `${SITE}/store/success?item=class-voucher&session_id={CHECKOUT_SESSION_ID}`,
    "line_items[0][price_data][unit_amount]": "5000",
    "line_items[0][price_data][product_data][name]": voucher.name,
    "metadata[slug]": voucher.slug,
  };
  applyGiftToStoreCheckout(params, { site: SITE, item: voucher, gift: GIFT });
  assert.equal(params["line_items[0][price_data][unit_amount]"], "5000");
  assert.equal(params["line_items[0][price_data][product_data][name]"], `Gift: ${voucher.name}`);
  assert.equal(params["metadata[slug]"], "class-voucher");
  assert.equal(params["metadata[gift_recipient_email]"], "recipient@example.com");
  assert.equal(params["metadata[gift_message]"], "Happy birthday!");
  assert.match(params.success_url, /gift=1/);
});

test("gifting office hours makes the 'which Friday?' field optional", () => {
  const params: Record<string, string> = {
    "custom_fields[0][key]": "preferred_friday",
    "custom_fields[0][label][custom]": "Which Friday would you like?",
    "custom_fields[0][optional]": "false",
  };
  applyGiftToStoreCheckout(params, { site: SITE, item: officeHoursDropIn, gift: GIFT });
  assert.equal(params["custom_fields[0][optional]"], "true");
  assert.ok(params["custom_fields[0][label][custom]"].length <= 50, "Stripe's custom field label limit");
});

// ── Gift membership checkout ────────────────────────────────────────────────

const INSIDER = { id: "insider" as const, name: "Insider", priceCents: 50000 };

test("gift membership: one-time payment, tier price × months, gift + term in the name", () => {
  const params = giftMembershipCheckoutParams({ site: SITE, tier: INSIDER, months: 3, gift: GIFT });
  assert.equal(params.mode, "payment");
  assert.equal(params["line_items[0][price_data][unit_amount]"], "150000");
  assert.equal(params["line_items[0][price_data][product_data][name]"], "Gift: Insider membership, 3 months");
  assert.equal(params["metadata[kind]"], "gift-membership");
  assert.equal(params["metadata[tier]"], "insider");
  assert.equal(params["metadata[months]"], "3");
  assert.equal(params["metadata[gift_recipient_email]"], "recipient@example.com");
  assert.equal(params.allow_promotion_codes, "false", "a $250 class voucher must not zero out a membership");
  assert.equal(params["line_items[0][price]"], undefined, "inline price_data, not a subscription Price");

  const one = giftMembershipCheckoutParams({ site: SITE, tier: INSIDER, months: 1, gift: GIFT });
  assert.equal(one["line_items[0][price_data][unit_amount]"], "50000");
  assert.equal(one["line_items[0][price_data][product_data][name]"], "Gift: Insider membership, 1 month");
});

test("gift membership metadata parses back, and rejects terms other than 1 or 3 months", () => {
  assert.deepEqual(parseGiftMembershipMetadata({ kind: "gift-membership", tier: "starter", months: "3" }), {
    tierId: "starter",
    months: 3,
  });
  assert.equal(parseGiftMembershipMetadata({ kind: "gift-membership", tier: "starter", months: "2" }), null);
  assert.equal(parseGiftMembershipMetadata({ kind: "gift-membership", tier: "gold", months: "1" }), null);
  assert.equal(parseGiftMembershipMetadata({ kind: "membership", tier: "starter", months: "1" }), null);
});

test("refuses a membership gift for someone whose membership a Stripe subscription pays for", () => {
  const subscriber = { tier: "starter", updatesUntil: new Date("2026-11-01"), grantSource: null, stripeCustomerId: "cus_1" };
  assert.equal(giftMembershipRefusal([subscriber]), GIFT_MEMBERSHIP_REFUSAL);
  assert.match(GIFT_MEMBERSHIP_REFUSAL, /class/i, "suggests a class gift instead");
});

test("refuses for a lifetime member; allows nobody-yet and a running fixed-term gift", () => {
  const lifetime = { tier: "insider", updatesUntil: null, grantSource: "comp", stripeCustomerId: null };
  const priorGift = { tier: "starter", updatesUntil: new Date("2026-11-01"), grantSource: "gift", stripeCustomerId: null };
  assert.equal(giftMembershipRefusal([lifetime]), GIFT_MEMBERSHIP_REFUSAL);
  assert.equal(giftMembershipRefusal([]), null);
  assert.equal(giftMembershipRefusal([priorGift]), null);
});

// ── Webhook: gifted store items ─────────────────────────────────────────────

type Call = { fn: string; args: unknown[] };

function catalogSetup(overrides: Partial<CatalogGiftDeps> = {}) {
  const calls: Call[] = [];
  const rec =
    <T,>(fn: string, result: T) =>
    async (...args: unknown[]) => {
      calls.push({ fn, args });
      return result;
    };
  const deps: CatalogGiftDeps = {
    checkoutSessionProcessed: rec("checkoutSessionProcessed", false),
    recordCheckoutSession: rec("recordCheckoutSession", undefined),
    getSeatsSold: rec("getSeatsSold", 3),
    createVoucherCode: rec("createVoucherCode", "LAB-TEST1234"),
    sendGiftedVoucherEmail: rec("sendGiftedVoucherEmail", undefined),
    sendGiftedItemEmail: rec("sendGiftedItemEmail", undefined),
    sendGiftBuyerConfirmation: rec("sendGiftBuyerConfirmation", undefined),
    sendOwnerAlert: rec("sendOwnerAlert", undefined),
    addZoomRegistrant: rec("addZoomRegistrant", true),
    grantClassDriveAccess: rec("grantClassDriveAccess", undefined),
    sendTelegramNotice: rec("sendTelegramNotice", undefined),
    ...overrides,
  };
  const called = (fn: string) => calls.filter((c) => c.fn === fn);
  return { deps, calls, called };
}

const CLASS_ITEM: CatalogGiftItem = {
  slug: "wed-2026-11-04-intro-x",
  name: "Intro to X",
  sessionDateISO: "2026-11-04T16:00:00Z",
  zoomRegistrationUrl: "https://zoom.example/register/abc",
  zoomMeetingId: "123456789",
  minEnrollment: 5,
  isWednesdayClass: true,
};

const catalogInput = (item: CatalogGiftItem) => ({
  eventId: "evt_gift_1",
  sessionId: "cs_gift_1",
  paymentIntentId: "pi_gift_1",
  amountCents: 10000,
  buyer: BUYER,
  gift: GIFT,
  item,
  bookingNote: null,
});

test("a gifted class seat fulfills the RECIPIENT: order, email, Zoom, Drive — buyer only gets a note", async () => {
  const { deps, called } = catalogSetup();
  const result = await fulfillCatalogGift(catalogInput(CLASS_ITEM), deps);
  assert.deepEqual(result, { deduped: false, action: "gifted wed-2026-11-04-intro-x → recipient@example.com" });

  const order = called("recordCheckoutSession")[0].args[0] as { email: string; name: string; sku: string; stripePaymentIntentId: string };
  assert.equal(order.email, "recipient@example.com", "order recorded against the recipient (materials + seats)");
  assert.equal(order.name, "Rae Cipient");
  assert.equal(order.sku, CLASS_ITEM.slug);
  assert.equal(order.stripePaymentIntentId, "pi_gift_1", "refunds still find it");

  const email = called("sendGiftedItemEmail")[0].args[0] as { email: string; fromName: string; message: string; underMinimum: unknown };
  assert.equal(email.email, "recipient@example.com");
  assert.equal(email.fromName, "Bea Buyer");
  assert.equal(email.message, "Happy birthday!");
  assert.deepEqual(email.underMinimum, { seatsSold: 3, minEnrollment: 5 });

  assert.deepEqual(called("addZoomRegistrant")[0].args, ["123456789", { email: "recipient@example.com", name: "Rae Cipient" }]);
  assert.deepEqual(called("grantClassDriveAccess")[0].args, [CLASS_ITEM.slug, "recipient@example.com"]);

  const buyerNote = called("sendGiftBuyerConfirmation")[0].args[0] as { email: string; recipientEmail: string };
  assert.equal(buyerNote.email, "buyer@example.com");
  assert.equal(buyerNote.recipientEmail, "recipient@example.com");

  assert.match(String(called("sendTelegramNotice")[0].args[0]), /gifted Rae Cipient a seat in "Intro to X"/);
  assert.match((called("sendOwnerAlert")[0].args[0] as { subject: string }).subject, /GIFT/);
});

test("a gifted voucher's code goes to the recipient, minted from the buyer's session", async () => {
  const { deps, called } = catalogSetup();
  await fulfillCatalogGift(
    catalogInput({ slug: "class-voucher", name: "Any-class voucher", isVoucher: true, isWednesdayClass: false }),
    deps
  );
  assert.deepEqual(called("createVoucherCode")[0].args[0], { buyerEmail: "buyer@example.com", stripeSessionId: "cs_gift_1" });
  const voucher = called("sendGiftedVoucherEmail")[0].args[0] as { email: string; code: string };
  assert.equal(voucher.email, "recipient@example.com");
  assert.equal(voucher.code, "LAB-TEST1234");
  assert.equal((called("recordCheckoutSession")[0].args[0] as { email: string }).email, "recipient@example.com");
  assert.equal(called("sendGiftedItemEmail").length, 0);
  assert.equal(called("addZoomRegistrant").length, 0);
  assert.equal(called("grantClassDriveAccess").length, 0);
});

test("a retried / resent gift event is deduped before anything is sent", async () => {
  const { deps, calls } = catalogSetup({ checkoutSessionProcessed: async () => true });
  const result = await fulfillCatalogGift(catalogInput(CLASS_ITEM), deps);
  assert.deepEqual(result, { deduped: true });
  assert.equal(calls.length, 0);
});

test("if the recipient's email fails, nothing is recorded (so Stripe's retry redoes it)", async () => {
  const { deps, called } = catalogSetup({
    sendGiftedItemEmail: async () => {
      throw new Error("resend down");
    },
  });
  await assert.rejects(fulfillCatalogGift(catalogInput(CLASS_ITEM), deps), /resend down/);
  assert.equal(called("recordCheckoutSession").length, 0);
});

test("a failed buyer note or Zoom/Drive hiccup never fails an already-delivered gift", async () => {
  const boom = async () => {
    throw new Error("boom");
  };
  const { deps, called } = catalogSetup({
    sendGiftBuyerConfirmation: boom,
    addZoomRegistrant: boom,
    grantClassDriveAccess: boom,
    sendTelegramNotice: boom,
  });
  const result = await fulfillCatalogGift(catalogInput(CLASS_ITEM), deps);
  assert.equal(result.deduped, false);
  assert.equal(called("recordCheckoutSession").length, 1);
});

// ── Webhook: gift memberships ───────────────────────────────────────────────

function membershipSetup(existing: ExistingMembership | null = null, overrides: Partial<GiftMembershipDeps> = {}) {
  const calls: Call[] = [];
  let current = existing;
  const rec =
    <T,>(fn: string, result: T) =>
    async (...args: unknown[]) => {
      calls.push({ fn, args });
      return result;
    };
  const deps: GiftMembershipDeps = {
    checkoutSessionProcessed: rec("checkoutSessionProcessed", false),
    recordCheckoutSession: rec("recordCheckoutSession", undefined),
    findOrCreateCustomer: rec("findOrCreateCustomer", 77),
    grantCompMembership: async (customerId, tier, until, source) => {
      calls.push({ fn: "grantCompMembership", args: [customerId, tier, until, source] });
      return applyMembershipGrant(
        {
          readMembership: async () => current,
          insertMembership: async (_id, plan) => {
            current = { tier: plan.tier, status: "active", updatesUntil: plan.until, grantSource: plan.source, version: "2" };
            return true;
          },
          updateMembership: async (_id, _v, plan) => {
            current = { tier: plan.tier, status: "active", updatesUntil: plan.until, grantSource: plan.source, version: "3" };
            return true;
          },
        },
        customerId,
        { tier, until, source },
        new Date("2026-10-06T15:00:00Z")
      );
    },
    mintBookingCredits: rec("mintBookingCredits", 9),
    linkMembershipCycleToOrder: rec("linkMembershipCycleToOrder", undefined),
    issueMagicLinkUrl: rec("issueMagicLinkUrl", "https://example.test/verify?token=m"),
    sendGiftedMembershipEmail: rec("sendGiftedMembershipEmail", undefined),
    sendGiftBuyerConfirmation: rec("sendGiftBuyerConfirmation", undefined),
    sendOwnerAlert: rec("sendOwnerAlert", undefined),
    sendTelegramNotice: rec("sendTelegramNotice", undefined),
    inviteToUpcomingSessions: rec("inviteToUpcomingSessions", undefined),
    ...overrides,
  };
  const called = (fn: string) => calls.filter((c) => c.fn === fn);
  return { deps, called, current: () => current };
}

const CREATED = new Date("2026-10-06T14:00:00Z");
const membershipInput = (tier: { id: "starter" | "unlimited" | "insider"; name: string; monthlyCredits: number | "unlimited" }, months: number) => ({
  eventId: "evt_gm_1",
  sessionId: "cs_gm_1",
  paymentIntentId: "pi_gm_1",
  amountCents: 60000,
  createdAt: CREATED,
  buyer: BUYER,
  gift: GIFT,
  tier,
  months,
});

test("gift Starter, 3 months: grant through created+3mo as a 'gift', 9 credits expiring the same day", async () => {
  const { deps, called, current } = membershipSetup();
  await fulfillGiftMembership(membershipInput({ id: "starter", name: "Starter", monthlyCredits: 3 }, 3), deps);
  const until = new Date("2027-01-06T14:00:00Z");
  assert.deepEqual(called("findOrCreateCustomer")[0].args, ["recipient@example.com", "Rae Cipient"]);
  assert.deepEqual(called("grantCompMembership")[0].args, [77, "starter", until, "gift"]);
  assert.equal(current()?.grantSource, "gift");
  assert.deepEqual(called("mintBookingCredits")[0].args, [77, 9, until]);

  const email = called("sendGiftedMembershipEmail")[0].args[0] as { email: string; tierId: string; credits: number; until: Date; magicLinkUrl: string };
  assert.equal(email.email, "recipient@example.com");
  assert.equal(email.tierId, "starter");
  assert.equal(email.credits, 9);
  assert.equal(email.until.getTime(), until.getTime());
  assert.equal(email.magicLinkUrl, "https://example.test/verify?token=m");

  const order = called("recordCheckoutSession")[0].args[0] as { email: string; sku: string };
  assert.equal(order.email, "recipient@example.com");
  assert.equal(order.sku, GIFT_MEMBERSHIP_SKU);
  assert.deepEqual(called("linkMembershipCycleToOrder")[0].args, [77, "cs_gm_1", until], "refund takes the gift back");
  assert.deepEqual(called("inviteToUpcomingSessions")[0].args, ["recipient@example.com"]);
  assert.equal((called("sendGiftBuyerConfirmation")[0].args[0] as { email: string }).email, "buyer@example.com");
});

test("gift Insider mints no credits (unlimited tiers never touch the credit system)", async () => {
  const { deps, called } = membershipSetup();
  await fulfillGiftMembership(membershipInput({ id: "insider", name: "Insider", monthlyCredits: "unlimited" }, 1), deps);
  assert.equal(called("mintBookingCredits").length, 0);
  assert.equal((called("sendGiftedMembershipEmail")[0].args[0] as { credits: number }).credits, 0);
});

test("the gift's end date comes from the session, so a retry lands on the same date", async () => {
  const a = membershipSetup();
  const b = membershipSetup();
  await fulfillGiftMembership(membershipInput({ id: "starter", name: "Starter", monthlyCredits: 3 }, 1), a.deps);
  await new Promise((r) => setTimeout(r, 5));
  await fulfillGiftMembership(membershipInput({ id: "starter", name: "Starter", monthlyCredits: 3 }, 1), b.deps);
  assert.deepEqual(a.called("mintBookingCredits")[0].args, b.called("mintBookingCredits")[0].args);
});

test("a gift to someone who already has more says so to the owner and never downgrades them", async () => {
  const lifetime: ExistingMembership = { tier: "insider", status: "active", updatesUntil: null, grantSource: "comp", version: "1" };
  const { deps, called, current } = membershipSetup(lifetime);
  await fulfillGiftMembership(membershipInput({ id: "starter", name: "Starter", monthlyCredits: 3 }, 1), deps);
  assert.equal(current()?.tier, "insider");
  assert.equal(current()?.updatesUntil, null);
  assert.match((called("sendOwnerAlert")[0].args[0] as { subject: string }).subject, /^CHECK:/);
});

test("a deduped gift-membership event does nothing at all", async () => {
  const { deps, called } = membershipSetup(null, { checkoutSessionProcessed: async () => true });
  const result = await fulfillGiftMembership(membershipInput({ id: "starter", name: "Starter", monthlyCredits: 3 }, 1), deps);
  assert.deepEqual(result, { deduped: true });
  assert.equal(called("grantCompMembership").length, 0);
  assert.equal(called("sendGiftedMembershipEmail").length, 0);
});

test("an invite failure doesn't fail an already-granted gift", async () => {
  const { deps, called } = membershipSetup(null, {
    inviteToUpcomingSessions: async () => {
      throw new Error("zoom down");
    },
  });
  const result = await fulfillGiftMembership(membershipInput({ id: "unlimited", name: "Unlimited", monthlyCredits: "unlimited" }, 3), deps);
  assert.equal(result.deduped, false);
  assert.equal(called("recordCheckoutSession").length, 1);
});
