import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import BuyButton from "@/components/BuyButton";
import { storeItems, formatPrice, STORE_LIVE } from "@/lib/store";

export const metadata: Metadata = {
  title: "Store: Courses, Skills & Templates",
  description:
    "Courses, AI skills, and templates — sold directly. No marketplace, no middleman: the only cut is card processing.",
  alternates: { canonical: "/store" },
};

const kindLabel: Record<string, string> = {
  course: "Course",
  "course-bundle": "Course bundle",
  skill: "AI skill",
  template: "Template",
  "repo-access": "Repo access",
};

export default function Store() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/store</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Buy direct. <span className="grad-text">Nobody takes a cut.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Everything here is sold by Alex, to you, with no marketplace in between. Card payments
          run through Stripe — a processor, not a platform — so the only fee anywhere is card
          processing. Prefer literally zero fees? Every item can also be invoiced for ACH or
          check: just email.
        </p>
        {!STORE_LIVE && (
          <p className="mt-5 inline-block rounded-full border border-amber/50 px-4 py-2 font-mono text-xs text-amber">
            ⚠ Store preview — checkout opens soon. Buttons email Alex directly for now.
          </p>
        )}
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {storeItems.map((item, i) => (
          <Reveal key={item.slug} delay={Math.min(i * 70, 280)}>
            <div className="glass flex h-full flex-col rounded-2xl p-7">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist">
                  {kindLabel[item.kind]}
                </span>
                <span className="font-mono text-lg font-bold text-teal">
                  {formatPrice(item.priceCents, item.priceNote)}
                </span>
              </div>
              <h2 className="mt-4 font-bold leading-snug">{item.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{item.blurb}</p>
              <p className="mt-3 text-xs leading-relaxed text-mist">
                <span className="text-snow">You get:</span> {item.delivery}
              </p>
              <div className="mt-5">
                {item.priceCents !== null ? (
                  <BuyButton slug={item.slug} label="Buy now →" itemName={item.name} />
                ) : (
                  <a
                    href={`mailto:info@alexcoulombepresents.com?subject=${encodeURIComponent(`Inquiry: ${item.name}`)}`}
                    className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
                  >
                    Inquire →
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <h2 className="text-xl font-bold">Why direct?</h2>
          <div className="mt-5 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-3">
            <p>
              <span className="text-snow">Marketplaces take 12–30%.</span> Fab, app stores,
              course platforms — they all skim. Buying here means the person who made the thing
              keeps what you paid, minus pennies of card processing.
            </p>
            <p>
              <span className="text-snow">Same product, same updates.</span> Skills sold here are
              identical to their Capafy listings. Templates match their Fab versions. You just
              choose where your money lands.
            </p>
            <p>
              <span className="text-snow">Zero-fee option, always.</span> Email{" "}
              <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
                info@alexcoulombepresents.com
              </a>{" "}
              for an invoice — ACH and checks clear with no processor at all.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
