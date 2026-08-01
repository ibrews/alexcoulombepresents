import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import InquireButton from "@/components/InquireButton";
import BuyButton from "@/components/BuyButton";
import { storeItems, formatPrice, effectivePriceCents, isPurchasable } from "@/lib/store";
import { digitalProducts, DIGITAL_LIVE } from "@/lib/commerce/products";
import { renderBreaks } from "@/components/Lines";
import { getRemaining } from "@/lib/commerce/seats";

export const metadata: Metadata = {
  title: "Work With Alex — Courses, Skills & Templates",
  description:
    "Unreal Engine training, AI skills for Claude Code, and spatial computing templates. Reach out to get started.",
  alternates: { canonical: "/store" },
};

// Re-render at most every minute so seat counts (real scarcity, not just
// marketing copy) and time-boxed listings (the cohort's early-bird cutoff,
// its sale-window close) stay close to live without a manual redeploy. The
// checkout API enforces both regardless of page staleness.
export const revalidate = 60;

const kindLabel: Record<string, string> = {
  course: "Course",
  "course-bundle": "Course bundle",
  skill: "AI skill",
  template: "Template",
  "repo-access": "Repo access",
};

const kindStyle: Record<string, string> = {
  course: "border-amber/60 text-amber",
  "course-bundle": "border-amber/60 text-amber",
  skill: "border-grape/60 text-grape",
  template: "border-teal/60 text-teal",
  "repo-access": "border-line text-mist",
};

export default async function Store() {
  // Seats remaining per capacity-limited item, keyed by slug. Fetched once
  // up front so the map below stays a simple sync render. Never let a DB
  // hiccup (or a build/preview environment with no DATABASE_URL) take the
  // whole store page down — fall back to "no seat data" and render normally.
  let remainingBySlug = new Map<string, number | null>();
  try {
    remainingBySlug = new Map<string, number | null>(
      await Promise.all(
        storeItems
          .filter((i) => i.capacity !== undefined)
          .map(async (i) => [i.slug, await getRemaining(i)] as const)
      )
    );
  } catch (err) {
    console.error("[seats] failed to load remaining seats", err);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/store</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Let&apos;s work together. <span className="grad-text">Get in touch to start.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Training, AI skills, and spatial computing templates — all made by Alex, for people who
          want to move fast and build real things. Anything with a price checks out instantly
          through Stripe; anything still cooking takes your email and pings you at launch.
        </p>
      </Reveal>

      {/* Company / team training — front and center */}
      <Reveal>
        <div className="glow-card mt-10 rounded-3xl border border-amber/40 p-7 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-amber">
                Buying for a company or studio?
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">
                Bundled curricula, scoped to your team.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                Custom multi-week programs assembled from 50+ ready-to-teach classes — the same
                training delivered to Epic&apos;s key partners. Pricing varies with team size and
                scope; quotes usually land within a day.
              </p>
            </div>
            <Link
              href="/training#teams"
              className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              Get a team quote →
            </Link>
          </div>
        </div>
      </Reveal>

      {/* External storefronts */}
      <Reveal>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-mist">Also available at:</span>
          <a
            href="https://ibrews.gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition-colors hover:border-teal/60 hover:text-snow"
          >
            Gumroad →
          </a>
          <a
            href="https://capafy.ai/publisher/alex-coulombe-presents"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition-colors hover:border-grape/60 hover:text-snow"
          >
            Capafy →
          </a>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {storeItems.map((item, i) => {
          const price = effectivePriceCents(item);
          const purchasable = isPurchasable(item);
          const closed = item.priceCents !== null && !item.externalUrl && !purchasable;
          const remaining = remainingBySlug.get(item.slug) ?? null;
          const soldOut = remaining !== null && remaining <= 0;
          return (
            <Reveal key={item.slug} delay={Math.min(i * 70, 280)}>
              <div className="glass flex h-full flex-col rounded-2xl p-7">
                <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider self-start ${kindStyle[item.kind] ?? "border-line text-mist"}`}>
                  {kindLabel[item.kind]}
                </span>
                <h2 className="mt-4 font-bold leading-snug">{item.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{renderBreaks(item.blurb)}</p>
                <p className="mt-3 text-xs leading-relaxed text-mist">
                  <span className="text-snow">You get:</span> {renderBreaks(item.delivery)}
                </p>
                {price !== null && !closed && (
                  <div className="mt-4">
                    {item.compareAt && (
                      <p className="font-mono text-xs text-mist">
                        {item.compareAt.map((c) => (
                          <span key={c} className="mr-3 line-through decoration-amber/70">
                            {c}
                          </span>
                        ))}
                      </p>
                    )}
                    <p className="mt-1 text-lg font-bold text-snow">
                      {formatPrice(price)}
                      {item.compareAt && (
                        <span className="ml-2 font-mono text-xs font-normal text-amber">
                          any group class
                        </span>
                      )}
                    </p>
                    {item.priceNote && (
                      <p className="mt-1 text-xs leading-relaxed text-mist">{item.priceNote}</p>
                    )}
                    {remaining !== null && (
                      <p className={`mt-1 font-mono text-xs ${remaining <= 10 ? "text-amber" : "text-mist"}`}>
                        {remaining > 0
                          ? `${remaining} of ${item.capacity} seats left`
                          : "Sold out"}
                      </p>
                    )}
                  </div>
                )}
                {closed && item.saleWindow && (
                  <p className="mt-4 text-sm text-amber">{item.saleWindow.closedNote}</p>
                )}
                <div className="mt-5">
                  {item.externalUrl ? (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full border border-grape/60 px-5 py-2.5 text-sm font-semibold text-snow transition-colors hover:border-grape hover:bg-grape/10"
                    >
                      Get it on Capafy →
                    </a>
                  ) : closed ? (
                    <InquireButton
                      label="Join the list for the next one →"
                      list={item.saleWindow!.closedList}
                      context={item.name}
                      successMessage="You'll hear the moment the next one's scheduled."
                    />
                  ) : soldOut ? (
                    <InquireButton
                      label="Sold out — join the waitlist →"
                      list="store"
                      context={item.name}
                      successMessage={`You're on the list — you'll hear if a seat opens up for ${item.name}.`}
                    />
                  ) : item.priceCents !== null ? (
                    <BuyButton slug={item.slug} label="Buy →" itemName={item.name} />
                  ) : (
                    <InquireButton
                      label={item.ctaLabel ?? "Inquire →"}
                      list={item.list ?? "store"}
                      context={item.name}
                      withMessage={!item.ctaLabel}
                      successMessage={
                        item.ctaLabel
                          ? "You're on the list — you'll hear the moment it launches."
                          : `Alex will be in touch about ${item.name}.`
                      }
                    />
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {/* Instant-download pipelines & apps — license key + R2 delivery on checkout */}
      <Reveal>
        <h2 className="mt-16 text-2xl font-bold">Pipelines &amp; apps — instant delivery</h2>
        <p className="mt-2 max-w-2xl text-sm text-mist">
          Buy, get a license key and download link by email in seconds. Apple Pay, cards, and Link
          all work at checkout.
        </p>
      </Reveal>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {digitalProducts.map((p, i) => (
          <Reveal key={p.sku} delay={Math.min(i * 70, 280)}>
            <div className="glass flex h-full flex-col rounded-2xl p-7">
              <span className="self-start rounded-full border border-teal/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                {p.kind ?? "Pipeline"}
              </span>
              <h3 className="mt-4 font-bold leading-snug">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{p.blurb}</p>
              <p className="mt-3 text-sm text-snow">{formatPrice(p.priceCents)}</p>
              <div className="mt-5">
                <BuyButton sku={p.sku} label="Buy →" itemName={p.name} live={DIGITAL_LIVE} />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Membership — coming soon */}
      <Reveal>
        <div className="glass mt-14 rounded-3xl border border-teal/30 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="inline-block rounded-full border border-amber/50 bg-amber/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber">
                Coming soon
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight md:text-2xl">
                The membership: every recording, member pricing, early access.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                One subscription for the whole class-recording library, standing discounts on
                everything here, first seats on Lab launches, and monthly office hours with Alex.
                Founding waitlist is open — members hear the price first and get the founding rate.
              </p>
            </div>
            <Link
              href="/members"
              className="rounded-full border border-teal/60 px-6 py-3 font-semibold text-snow transition-colors hover:bg-teal/10"
            >
              Join the founding waitlist →
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <h2 className="text-xl font-bold">Not sure where to start?</h2>
          <div className="mt-5 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-3">
            <p>
              <span className="text-snow">Training.</span> From one intro session to a full
              eleven-class curriculum — live, on your schedule, using your own project as the
              sandbox.
            </p>
            <p>
              <span className="text-snow">Skills and templates.</span> Installable Claude Code
              skills and Unreal templates also live on{" "}
              <a className="text-teal hover:underline" href="https://capafy.ai/publisher/alex-coulombe-presents" target="_blank" rel="noopener noreferrer">
                Capafy
              </a>{" "}
              and{" "}
              <a className="text-teal hover:underline" href="https://ibrews.gumroad.com" target="_blank" rel="noopener noreferrer">
                Gumroad
              </a>
              .
            </p>
            <p>
              <span className="text-snow">Custom work.</span> Pilot projects, collaborations, and
              studio pipelines — that&apos;s{" "}
              <a
                className="text-teal hover:underline"
                href="https://agilelens.com/portfolio"
                target="_blank"
                rel="noopener noreferrer"
              >
                Agile Lens
              </a>{" "}
              territory (browse the portfolio). Email{" "}
              <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
                info@alexcoulombepresents.com
              </a>{" "}
              or use the{" "}
              <a className="text-teal hover:underline" href="/contact">
                contact form
              </a>
              .
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
