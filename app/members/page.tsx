import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import WaitlistForm from "@/components/WaitlistForm";
import JoinMembershipButton from "@/components/JoinMembershipButton";
import GiftButton from "@/components/GiftButton";
import TrailerVideo from "@/components/TrailerVideo";
import { ACCESS_LABEL, trailer, trailersFor, type Trailer } from "@/lib/trailers";
import { customerFromSession } from "@/lib/commerce/tokens";
import {
  isMember,
  memberTierForCustomer,
  memberBenefits,
  MEMBERSHIP_LIVE,
  MEMBERSHIP_TIERS,
  STARTER_TIER,
  TIER_COMPARISON,
  membershipPriceRange,
} from "@/lib/commerce/membership";

// Title/description track MEMBERSHIP_LIVE so the tab and social cards never
// advertise "Coming Soon" over a page that is actually selling a subscription.
export const metadata: Metadata = {
  title: MEMBERSHIP_LIVE ? "Members" : "Members — Coming Soon",
  description: MEMBERSHIP_LIVE
    ? `The Alex Coulombe Presents membership: three tiers from ${membershipPriceRange()} — class credits or unlimited classes, every recording, member pricing, and a vote on what gets taught next that counts for more the higher your tier.`
    : "The Alex Coulombe Presents membership: every class recording, member pricing, early Lab access, and a vote on what gets taught next. Join the founding waitlist.",
  alternates: { canonical: "/members" },
};

export default async function Members({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  // Membership rides the existing magic-link session — a signed-in member
  // (comped or subscribed) sees the member view the day it opens.
  const [sessionToken, { joined }] = await Promise.all([
    cookies().then((c) => c.get("acp_session")?.value),
    searchParams,
  ]);
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const [member, tierId] = customerId
    ? await Promise.all([isMember(customerId).catch(() => false), memberTierForCustomer(customerId).catch(() => null)])
    : [false, null];
  const activeTier = MEMBERSHIP_TIERS.find((t) => t.id === tierId);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
      <Reveal>
        <p className="font-mono text-sm text-teal">/members</p>
        {!MEMBERSHIP_LIVE && (
          <p className="mt-4 inline-block rounded-full border border-amber/50 bg-amber/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-amber">
            Coming soon · founding waitlist open
          </p>
        )}
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          The members&apos; side <span className="grad-text">of the lab.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Three tiers, everything behind the curtain: the full class-recording library, standing
          member pricing, and a vote on what gets taught next that counts for more the higher your
          tier.{" "}
          {MEMBERSHIP_LIVE
            ? `${membershipPriceRange()} — cancel anytime.`
            : "Pricing lands with the launch — waitlist members hear first and get the founding rate."}
        </p>
        {MEMBERSHIP_LIVE && (
          <p className="mt-4 inline-flex max-w-xl flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-grape/40 bg-grape/10 px-4 py-3 text-sm">
            <span className="rounded-full bg-grape px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
              Cheapest way in!
            </span>
            <span className="text-mist">
              Starter is{" "}
              <span className="font-bold text-snow">
                {STARTER_TIER.priceLabel} for {STARTER_TIER.monthlyCredits} classes
              </span>{" "}
              — cheaper than buying them one at a time.
            </span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#compare" className="rounded-full border border-line px-4 py-2 transition-colors hover:border-teal/60">
            Compare the tiers ↓
          </a>
          <a href="#lab" className="rounded-full border border-line px-4 py-2 transition-colors hover:border-teal/60">
            Watch the tools ↓
          </a>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <TrailerVideo slug="become-a-member" title={trailer("become-a-member").title} ambient className="glow-card" />
      </Reveal>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {memberBenefits.map((b, i) => (
          <Reveal key={b.title} delay={Math.min(i * 60, 240)}>
            <div className="glass h-full rounded-2xl p-6">
              <h2 className="font-bold">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">{b.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="glass mt-6 grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Ask your employer</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Many companies cover professional development and continuing education — worth checking
              your training budget before this comes out of your own pocket.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Possibly a write-off</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              If you&apos;re self-employed or run a business, classes like these can often be deducted
              as an ordinary business expense that maintains job-related skills. W-2 employees generally
              can&apos;t deduct unreimbursed education costs on federal returns, though a few states
              still allow it. Not tax advice — check with your accountant.
            </p>
          </div>
        </div>
      </Reveal>

      {MEMBERSHIP_LIVE && (
        <Reveal>
          <section id="compare" className="mt-16 scroll-mt-28">
            <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
              What each tier <span className="grad-text">actually gets.</span>
            </h2>
            <div className="glass mt-8 overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-4" />
                    {MEMBERSHIP_TIERS.map((t, i) => (
                      <th key={t.id} scope="col" className="p-4 text-center align-bottom">
                        {t.id === tierId && (
                          <span className="mb-2 inline-block rounded-full bg-teal px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
                            Your plan
                          </span>
                        )}
                        <span className={`block font-bold ${["text-grape", "text-teal", "text-amber"][i] ?? "text-snow"}`}>
                          {t.name}
                        </span>
                        <span className="mt-1 block text-lg font-bold text-snow">{t.priceLabel}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIER_COMPARISON.map((row) => (
                    <tr key={row.label} className="border-b border-line/50 last:border-0">
                      <th scope="row" className="p-4 font-normal">
                        <span className="text-snow">{row.label}</span>
                        {row.detail && <span className="mt-0.5 block text-xs text-mist">{row.detail}</span>}
                      </th>
                      {row.cells.map((c, i) => (
                        <td key={MEMBERSHIP_TIERS[i]?.id ?? i} className="p-4 text-center">
                          {c === true ? (
                            <span className="text-lg text-teal" aria-label="Included">✓</span>
                          ) : c === false ? (
                            <span className="text-mist/40" aria-label="Not included">—</span>
                          ) : (
                            <span className="text-snow">{c}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}

      {member ? (
        <>
          <Reveal>
            <div className="glow-card mt-14 rounded-3xl border border-teal/40 p-8 text-center md:p-10">
              <p className="font-mono text-xs uppercase tracking-widest text-teal">
                {activeTier ? `${activeTier.name} membership active ✓` : "Membership active ✓"}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">You&apos;re in — welcome.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-mist">
                Your class credits and billing live in{" "}
                <Link href="/account" className="text-teal hover:underline">
                  your account
                </Link>
                ; more member perks unlock as the program rolls out.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/members/recordings"
                  className="rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  Browse the recording library →
                </Link>
                <Link
                  href="/materials"
                  className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
                >
                  Class materials →
                </Link>
                <Link
                  href="/members/tools"
                  className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
                >
                  Browse the Lab tools →
                </Link>
                <Link
                  href="/members/decks"
                  className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
                >
                  Spatial Deck presentations →
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Existing members previously had no way to even SEE the other
              tiers, let alone switch — /members swapped straight to the
              status card above with no comparison anywhere on the site.
              Self-serve switching isn't wired up yet (would ride the Stripe
              Customer Portal's subscription-update feature once that's
              confirmed configured), so the CTA routes to a support email
              rather than promising a click-to-switch flow that doesn't
              exist. */}
          <Reveal>
            <div className="mt-14">
              <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
                Want to switch tiers?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-mist">
                Upgrade, downgrade, or ask a question — email{" "}
                <a href="mailto:info@alexcoulombepresents.com" className="text-teal hover:underline">
                  info@alexcoulombepresents.com
                </a>{" "}
                and it takes effect at your next renewal.
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {MEMBERSHIP_TIERS.map((tier) => {
                  const isCurrent = tier.id === tierId;
                  return (
                    <div
                      key={tier.id}
                      className={`glass flex h-full flex-col rounded-2xl p-7 ${
                        isCurrent ? "border-teal ring-2 ring-teal/40" : ""
                      }`}
                    >
                      {isCurrent && (
                        <span className="self-start rounded-full bg-teal px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
                          Your plan
                        </span>
                      )}
                      <h3 className="mt-3 font-bold">{tier.name}</h3>
                      <p className="mt-1 text-2xl font-bold text-snow">{tier.priceLabel}</p>
                      <p className="mt-1 text-sm text-mist">{tier.tagline}</p>
                      <ul className="mt-4 flex-1 space-y-2">
                        {tier.benefits.map((b) => (
                          <li key={b} className="flex gap-2 text-xs leading-relaxed text-mist">
                            <span className="mt-0.5 text-teal/70">✦</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        {isCurrent ? (
                          <span className="block rounded-full border border-line px-6 py-2.5 text-center text-sm font-semibold text-mist">
                            Current plan
                          </span>
                        ) : (
                          <a
                            href={`mailto:info@alexcoulombepresents.com?subject=${encodeURIComponent(
                              `Switch to ${tier.name}`
                            )}`}
                            className="block rounded-full bg-snow px-6 py-2.5 text-center text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                          >
                            Switch to {tier.name} →
                          </a>
                        )}
                        {MEMBERSHIP_LIVE && (
                          <div className="mt-3">
                            <GiftButton
                              membershipTier={tier.id}
                              priceCents={tier.priceCents}
                              itemName={`${tier.name} membership`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </>
      ) : MEMBERSHIP_LIVE ? (
        <Reveal>
          {joined === "1" ? (
            <div className="glass mt-14 rounded-3xl p-8 text-center md:p-12">
              <p className="font-mono text-xs uppercase tracking-widest text-teal">
                Payment received ✓
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">You&apos;re in — welcome.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist">
                Your membership activates automatically — usually instant. Check your email for a
                sign-in link, or refresh this page in a moment. Nothing after a few minutes? Email{" "}
                <a href="mailto:info@alexcoulombepresents.com" className="text-teal hover:underline">
                  info@alexcoulombepresents.com
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="mt-14">
              <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
                Pick a tier.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-mist">
                Every tier includes recordings and member pricing. Cancel anytime from your account.
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {MEMBERSHIP_TIERS.map((tier, i) => (
                  <div
                    key={tier.id}
                    className={`glass flex h-full flex-col rounded-2xl p-7 ${
                      i === 1 ? "border-teal/50" : i === 0 ? "border-grape/50" : "border-amber/50"
                    }`}
                  >
                    {i === 1 && (
                      <span className="self-start rounded-full bg-teal px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
                        Best deal!
                      </span>
                    )}
                    {i === 0 && (
                      <span className="self-start rounded-full bg-grape px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
                        Most popular!
                      </span>
                    )}
                    {i === 2 && (
                      <span className="self-start rounded-full bg-amber px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
                        Premier access!
                      </span>
                    )}
                    <h3 className="mt-3 font-bold">{tier.name}</h3>
                    <p className="mt-1 text-2xl font-bold text-snow">{tier.priceLabel}</p>
                    <p className="mt-1 text-sm text-mist">{tier.tagline}</p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {tier.benefits.map((b) => (
                        <li key={b} className="flex gap-2 text-xs leading-relaxed text-mist">
                          <span className="mt-0.5 text-teal/70">✦</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <JoinMembershipButton tier={tier.id} label={`Join ${tier.name} →`} />
                      <div className="mt-3">
                        <GiftButton
                          membershipTier={tier.id}
                          priceCents={tier.priceCents}
                          itemName={`${tier.name} membership`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Reveal>
      ) : (
        <Reveal>
          <div className="glass mt-14 rounded-3xl p-8 text-center md:p-12">
            <h2 className="text-2xl font-bold tracking-tight">Founding members hear it first.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-mist">
              No card, no commitment — just first crack at the founding price when doors open, and a
              real say in what the membership includes.
            </p>
            <div className="mx-auto mt-6 max-w-md">
              <WaitlistForm
                list="members"
                withName
                withMessage
                cta="Join the founding waitlist →"
                successTitle="You're on the founding list."
                successMessage="You'll get the founding rate and the first invite when membership opens."
              />
            </div>
          </div>
        </Reveal>
      )}

      <section id="lab" className="mt-24 scroll-mt-28">
        <Reveal>
          <p className="font-mono text-sm text-teal">/members/lab</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
            See what you&apos;re <span className="grad-text">getting.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">
            Every tier gets the Lab: tools Alex builds for his own XR and Unreal work, shipping today.
            About twenty seconds each.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {trailersFor("members-lab").map((t, i) => (
            <TrailerCard key={t.slug} t={t} delay={Math.min(i * 80, 240)} />
          ))}
        </div>

        <Reveal>
          <div className="glass mt-20 rounded-3xl p-6 md:p-10">
            <p className="font-mono text-[11px] uppercase tracking-widest text-teal">{ACCESS_LABEL.template}</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              The Ultimate OpenXR <span className="grad-text">Template</span>
            </h3>
            <p className="mt-3 max-w-3xl leading-relaxed text-mist">
              One Blueprint-only Unreal Engine 5.8 project for Quest, PICO, Android XR and Apple Vision Pro,
              with hand tracking and gestures built in. It&apos;s the starting point for Alex&apos;s XR
              projects, and every fix those projects find goes back into it. Below, an AI drives both hands
              in a simulator — no headset on, every check passing.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {trailersFor("template").map((t) => (
                <div key={t.slug}>
                  <TrailerVideo slug={t.slug} title={t.title} />
                  <h4 className="mt-4 font-bold">{t.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-mist">{t.tagline}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <h3 className="mt-20 text-2xl font-bold tracking-tight">Coming next</h3>
          <p className="mt-2 max-w-2xl text-mist">
            Insiders get in-progress tools early. The Unreal plugins are still in development — the plugins
            page shows where each one stands.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {trailersFor("coming-to-lab", "plugin", "open-source").map((t, i) => (
            <TrailerCard key={t.slug} t={t} delay={Math.min(i * 60, 240)} compact />
          ))}
        </div>

        <Reveal>
          <div className="mt-20">
            <h3 className="text-2xl font-bold tracking-tight">{trailer("all-tools-reel").title}</h3>
            <p className="mt-2 max-w-2xl text-mist">{trailer("all-tools-reel").tagline}</p>
            <TrailerVideo slug="all-tools-reel" title={trailer("all-tools-reel").title} className="mt-6" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function TrailerCard({ t, delay, compact = false }: { t: Trailer; delay: number; compact?: boolean }) {
  const external = t.href?.startsWith("http");
  return (
    <Reveal delay={delay}>
      <div className="h-full">
        <TrailerVideo slug={t.slug} title={t.title} />
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-teal">{ACCESS_LABEL[t.access]}</p>
        <h4 className={`mt-1 font-bold ${compact ? "text-lg" : "text-xl"}`}>{t.title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-mist">{t.tagline}</p>
        {t.href && (
          <a
            href={t.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="mt-2 inline-block text-sm text-teal hover:underline"
          >
            {external ? "Get it on GitHub →" : "Learn more →"}
          </a>
        )}
      </div>
    </Reveal>
  );
}
