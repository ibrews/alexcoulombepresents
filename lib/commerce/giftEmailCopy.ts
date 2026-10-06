// ── Gift + comp email copy — pure renderers ─────────────────────────────────
// Plain-text bodies for every gift-shaped email: a comped or gifted
// membership, a gifted class seat or voucher, and the buyer's "your gift was
// sent" confirmation. Kept free of runtime imports so the copy is unit-tested
// and the admin comp endpoint's dryRun can show the exact text that would go
// out. lib/commerce/email.ts does the sending (and supplies the tier data
// from MEMBERSHIP_TIERS, so benefit lists can't drift from /members).

export type RenderedEmail = { subject: string; text: string };

export type GiftTierInfo = {
  name: string;
  benefits: string[];
  monthlyCredits: number | "unlimited";
};

const SITE = "https://www.alexcoulombepresents.com";

function greeting(name?: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hi there,";
}

function dateLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}

function quotedMessage(fromName: string | null | undefined, message: string | null | undefined): string[] {
  const text = message?.trim();
  if (!text) return [];
  return ["", `A note from ${fromName?.trim() || "them"}:`, "", ...text.split("\n").map((l) => `    ${l}`)];
}

export const INSTRUCTOR_GIFT_SUBJECT = "You've been gifted a membership to Alex Coulombe Presents!";

export type GiftedMembershipEmailInput = {
  /** "instructor": Alex's thank-you comp. "gift": someone bought it for them. */
  variant: "instructor" | "gift";
  recipientName?: string | null;
  tier: GiftTierInfo;
  /** Whether `tier` is the highest tier — the instructor copy says so. */
  topTier?: boolean;
  /** What they actually hold after the grant; null = lifetime. */
  until: Date | null;
  /** Term the gift was bought for (gift variant only). */
  months?: number | null;
  /** Booking credits minted with this gift (Starter gifts only). */
  credits?: number | null;
  fromName?: string | null;
  message?: string | null;
  magicLinkUrl: string;
  /** Insider's bundled Gumroad library code — server-only, see email.ts. */
  gumroad?: { code: string; url: string } | null;
};

export function renderGiftedMembershipEmail(input: GiftedMembershipEmailInput): RenderedEmail {
  const { tier } = input;
  const lifetime = input.until === null;
  const from = input.fromName?.trim();
  const term = lifetime ? "lifetime" : input.months ? `${input.months}-month` : "";
  const article = /^[aeiou]/i.test(term || tier.name) ? "an" : "a";
  const what = `${article} ${term ? `${term} ` : ""}${tier.name} membership`;

  const opener =
    input.variant === "instructor"
      ? [
          "Thank you for teaching with me. Having you in front of the class meant a lot, to me and",
          "to everyone who showed up, and I wanted to say thanks in a way that sticks around.",
          "",
          [
            `So I've given you ${what} to Alex Coulombe Presents.`,
            input.topTier ? `${tier.name} is the top tier.` : "",
            lifetime ? "It never expires." : "",
          ]
            .filter(Boolean)
            .join(" "),
        ]
      : [
          `${from || "Someone"} just gave you ${what} to Alex Coulombe Presents!`,
          ...quotedMessage(from, input.message),
        ];

  const credits =
    input.credits && input.credits > 0 && input.until
      ? ["", `Your ${input.credits} class credits are ready now, good for any class or office hours through ${dateLabel(input.until)}.`]
      : [];

  const gumroad = input.gumroad
    ? [
        "",
        "Your Gumroad course library comes with it. Use this code at checkout and everything comes out free:",
        "",
        `    ${input.gumroad.code}`,
        "",
        `Browse the catalog at ${input.gumroad.url}.`,
      ]
    : [];

  const ending = lifetime
    ? []
    : [
        "",
        `Nothing renews and nothing gets charged. It's a gift, so it simply ends on ${dateLabel(input.until!)}.`,
        `If you'd like to keep going after that, you can join any time at ${SITE}/members.`,
      ];

  const text = [
    greeting(input.recipientName),
    "",
    ...opener,
    "",
    lifetime ? "Here's what's included:" : `Here's what's included through ${dateLabel(input.until!)}:`,
    ...tier.benefits.map((b) => `  • ${b}`),
    ...credits,
    ...gumroad,
    "",
    "You'll get a Zoom invite to every upcoming class and to office hours automatically, so there's",
    "nothing to sign up for. They'll land in your inbox as sessions get scheduled.",
    "",
    "Sign in to the members' area here (the link expires in 30 minutes):",
    input.magicLinkUrl,
    "",
    `If it expires, request a fresh one any time at ${SITE}/account.`,
    ...ending,
    "",
    input.variant === "instructor"
      ? "Thanks again. Reply any time; it comes straight to me."
      : "Questions? Just reply; it comes straight to me.",
    "",
    "Alex",
  ].join("\n");

  const subject =
    input.variant === "gift" && from
      ? `${from} gifted you a membership to Alex Coulombe Presents!`
      : INSTRUCTOR_GIFT_SUBJECT;
  return { subject, text };
}

// ── Gifted store items (class seat, office hours, consultation, voucher) ────

export type GiftedItemInfo = {
  slug: string;
  name: string;
  sessionDateISO?: string;
  zoomRegistrationUrl?: string;
  schedulingUrl?: string;
  isOfficeHours?: boolean;
  isVoucher?: boolean;
};

/** "a seat in "Intro to VR"", "a 1-hour consultation with Alex", … */
export function giftPhrase(item: GiftedItemInfo): string {
  if (item.isVoucher) return "an any-class voucher";
  if (item.isOfficeHours) return "a drop-in seat at Alex's live office hours";
  if (item.schedulingUrl) return `a ${item.name.charAt(0).toLowerCase()}${item.name.slice(1)}`;
  return `a seat in "${item.name}"`;
}

export function renderGiftedItemEmail(input: {
  item: GiftedItemInfo;
  recipientName?: string | null;
  fromName?: string | null;
  message?: string | null;
  /** Office hours' "which Friday?" answer, when the buyer gave one. */
  bookingNote?: string | null;
  /** Dated classes still under minEnrollment — see sendOrderEmails. */
  underMinimum?: { seatsSold: number; minEnrollment: number } | null;
}): RenderedEmail {
  const { item } = input;
  const from = input.fromName?.trim() || "Someone";

  const next: string[] = [];
  if (item.sessionDateISO) {
    const when = new Date(item.sessionDateISO).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
      timeZoneName: "short",
    });
    next.push(`It's live on ${when}.`);
  }
  if (item.zoomRegistrationUrl) {
    next.push("", `Register for the Zoom session here: ${item.zoomRegistrationUrl}`);
  }
  if (item.isOfficeHours) {
    next.push(
      input.bookingNote?.trim()
        ? `${from} picked: ${input.bookingNote.trim()}. Alex will send the Zoom link for that Friday. If it doesn't work for you, just reply and pick another (every Friday, 1p ET).`
        : "Just reply to this email with the Friday you'd like (every Friday, 1p ET) and Alex will send the Zoom link for that date."
    );
  }
  if (item.schedulingUrl) {
    next.push(`Pick a time that works for you here: ${item.schedulingUrl}`);
  }
  if (item.sessionDateISO) {
    next.push(
      "",
      `Class materials and the recording show up at ${SITE}/materials. Sign in with this email address and they're already unlocked.`
    );
  }
  if (next.length === 0) next.push("Just reply to this email and Alex will get you set up.");

  const underMinimum = input.underMinimum
    ? [
        "",
        `Heads up: this one runs once ${input.underMinimum.minEnrollment} people sign up, and ${input.underMinimum.seatsSold} have so far.`,
        "If it doesn't fill, you'll get a coupon worth 110% of the seat for any future class (or a full refund to the giver).",
      ]
    : [];

  const text = [
    greeting(input.recipientName),
    "",
    `${from} gave you ${giftPhrase(item)}!`,
    ...quotedMessage(from, input.message),
    "",
    ...next,
    ...underMinimum,
    "",
    "Questions about any of it? Just reply; it goes straight to Alex.",
    "",
    "Alex Coulombe Presents",
    SITE,
  ].join("\n");

  return { subject: `${from} gave you ${giftPhrase(item)}`, text };
}

export function renderGiftedVoucherEmail(input: {
  recipientName?: string | null;
  fromName?: string | null;
  message?: string | null;
  code: string;
}): RenderedEmail {
  const from = input.fromName?.trim() || "Someone";
  const text = [
    greeting(input.recipientName),
    "",
    `${from} gave you a class voucher, good for a seat in any open-enrollment class!`,
    ...quotedMessage(from, input.message),
    "",
    "Your code:",
    "",
    `    ${input.code}`,
    "",
    `How to use it: pick any open-enrollment class at ${SITE}/training (or /store), hit Buy, and`,
    "enter the code at checkout. Any intro or advanced class comes out to $0. (Private 1:1 sessions",
    "are separate.) One use, and it never expires.",
    "",
    "Want help picking a class? Just reply; it goes straight to Alex.",
    "",
    "Alex Coulombe Presents",
    SITE,
  ].join("\n");
  return { subject: `${from} gave you a class voucher: ${input.code}`, text };
}

export function renderGiftBuyerConfirmation(input: {
  buyerName?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  /** e.g. `a seat in "Intro to VR"` or "a 3-month Starter membership". */
  giftDescription: string;
  amountCents: number;
}): RenderedEmail {
  const who = input.recipientName?.trim()
    ? `${input.recipientName.trim()} (${input.recipientEmail})`
    : input.recipientEmail;
  const dollars = (input.amountCents / 100).toFixed(2);
  const text = [
    greeting(input.buyerName),
    "",
    `Thank you! Your gift of ${input.giftDescription} was just sent to ${who}.`,
    "They've got an email with everything they need to use it, along with your note if you left one.",
    "",
    `  ${input.giftDescription}: $${dollars}`,
    "",
    "If anything looks off (wrong address, a typo in the note), just reply and Alex will sort it out.",
    "",
    "Alex Coulombe Presents",
    SITE,
  ].join("\n");
  return { subject: `Your gift is on its way to ${input.recipientName?.trim() || input.recipientEmail}`, text };
}
