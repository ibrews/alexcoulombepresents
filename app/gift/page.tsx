import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import GiftButton from "@/components/GiftButton";
import {
  storeItems,
  wednesdayCalendar,
  formatPrice,
  effectivePriceCents,
  isPurchasable,
  STORE_LIVE,
  type StoreItem,
} from "@/lib/store";
import { getRemaining } from "@/lib/commerce/seats";
import { MEMBERSHIP_LIVE, MEMBERSHIP_TIERS } from "@/lib/commerce/membership";
import { GIFT_MEMBERSHIP_TERMS, isGiftable } from "@/lib/commerce/gifts";

export const metadata: Metadata = {
  title: "Give a Gift — Classes, Vouchers & Memberships",
  description:
    "Gift a live Unreal Engine class, a class voucher, office hours, or a membership. You pay; they get an email with everything they need and your note.",
  alternates: { canonical: "/gift" },
};

// Same freshness as /store: seat counts and sale windows stay close to live.
// Checkout enforces both regardless.
export const revalidate = 60;

function sessionLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

function GiftCard({ item, remaining }: { item: StoreItem; remaining: number | null }) {
  const price = effectivePriceCents(item);
  const soldOut = remaining !== null && remaining <= 0;
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-6">
      {item.sessionDateISO && (
        <p className="font-mono text-xs uppercase tracking-widest text-amber">{sessionLabel(item.sessionDateISO)}</p>
      )}
      <h3 className="mt-2 font-bold leading-snug">{item.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{item.blurb}</p>
      {!item.hidePrice && price !== null && <p className="mt-3 text-lg font-bold text-snow">{formatPrice(price)}</p>}
      {remaining !== null && !soldOut && remaining <= 10 && (
        <p className="mt-1 font-mono text-xs text-amber">{remaining} left</p>
      )}
      <div className="mt-4">
        {soldOut ? (
          <p className="text-sm text-mist">Sold out.</p>
        ) : STORE_LIVE ? (
          <GiftButton slug={item.slug} itemName={item.name} label="Give this as a gift" />
        ) : null}
      </div>
    </div>
  );
}

export default async function Gift({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const now = new Date();

  const upcomingClasses = wednesdayCalendar.filter(
    (c) => c.sessionDateISO && new Date(c.sessionDateISO) > now && isPurchasable(c, now)
  );
  const otherGifts = storeItems.filter((i) => !i.sessionDateISO && isGiftable(i) && isPurchasable(i, now));

  // Never let a DB hiccup (or a preview build with no DATABASE_URL) take the
  // page down — no seat data just means no "N left" line.
  let remainingBySlug = new Map<string, number | null>();
  try {
    remainingBySlug = new Map(
      await Promise.all(
        [...upcomingClasses, ...otherGifts]
          .filter((i) => i.capacity !== undefined)
          .map(async (i) => [i.slug, await getRemaining(i)] as const)
      )
    );
  } catch (err) {
    console.error("[gift] failed to load remaining seats", err);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/gift</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Give someone <span className="grad-text">something to build.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          A live class, a voucher for any class, office hours, or a membership. You pay; they get an
          email with everything they need (the Zoom link, the voucher code, or a sign-in link) plus
          your note, and you get a confirmation that it landed.
        </p>
      </Reveal>

      {sent === "membership" && (
        <Reveal>
          <div className="glow-card mt-10 rounded-3xl border border-grape/40 p-7 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-grape">Gift sent ✓</p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-mist">
              Payment received. Their membership switches on automatically and they&apos;ll get an
              email with a sign-in link in a minute or two. You&apos;ll get a confirmation too.
              Anything look off? Email{" "}
              <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
                info@alexcoulombepresents.com
              </a>
              .
            </p>
          </div>
        </Reveal>
      )}

      {!STORE_LIVE && (
        <p className="mt-10 rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-amber">
          Gifting opens when the store does. Until then, email{" "}
          <a className="underline" href="mailto:info@alexcoulombepresents.com">
            info@alexcoulombepresents.com
          </a>{" "}
          and Alex will set one up by hand.
        </p>
      )}

      {MEMBERSHIP_LIVE && (
        <section id="memberships" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">A membership</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
              {GIFT_MEMBERSHIP_TERMS.join(" or ")} months of any tier, paid once. Nothing renews and
              their card is never asked for. If they want to keep going afterward, they can join
              themselves.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier) => (
              <div key={tier.id} className="glass flex h-full flex-col rounded-2xl p-6">
                <h3 className="font-bold">{tier.name}</h3>
                <p className="mt-1 text-sm text-mist">{tier.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GIFT_MEMBERSHIP_TERMS.map((m) => (
                    <span key={m} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-snow">
                      {m} month{m === 1 ? "" : "s"} · ${((tier.priceCents * m) / 100).toLocaleString("en-US")}
                    </span>
                  ))}
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {tier.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-xs leading-relaxed text-mist">
                      <span className="mt-0.5 text-teal/70">✦</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <GiftButton
                    membershipTier={tier.id}
                    priceCents={tier.priceCents}
                    itemName={`${tier.name} membership`}
                    label={`Gift ${tier.name}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="classes" className="mt-16 scroll-mt-24">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">A seat in an upcoming class</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
            Live, two hours, over Zoom. They&apos;re registered on the meeting automatically, and the
            class materials and recording unlock for them.
          </p>
        </Reveal>
        {upcomingClasses.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses.map((item) => (
              <GiftCard key={item.slug} item={item} remaining={remainingBySlug.get(item.slug) ?? null} />
            ))}
          </div>
        ) : (
          <p className="glass mt-6 rounded-2xl p-6 text-sm leading-relaxed text-mist">
            The next run of classes isn&apos;t on the calendar yet. A class voucher (below) works for
            any of them, whenever they&apos;re scheduled, and never expires.
          </p>
        )}
      </section>

      {otherGifts.length > 0 && (
        <section id="more" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Vouchers and sessions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
              Not sure which class? A voucher lets them pick. Or give them time with Alex directly.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {otherGifts.map((item) => (
              <GiftCard key={item.slug} item={item} remaining={remainingBySlug.get(item.slug) ?? null} />
            ))}
          </div>
        </section>
      )}

      <Reveal>
        <p className="mt-16 text-center text-sm text-mist">
          Want something that isn&apos;t here?{" "}
          <Link className="text-teal hover:underline" href="/contact">
            Get in touch
          </Link>{" "}
          or browse the{" "}
          <Link className="text-teal hover:underline" href="/store">
            full store
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
