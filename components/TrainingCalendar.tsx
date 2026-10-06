import Link from "next/link";
import Reveal from "@/components/Reveal";
import BuyButton from "@/components/BuyButton";
import { wednesdayCalendar, officeHoursDropIn, consultationDropIn, formatPrice, isPurchasable } from "@/lib/store";
import { STARTER_TIER } from "@/lib/commerce/membership";
import { upcomingTbdWednesdays } from "@/lib/trainingCalendarDates";
import { upcomingSessions, sessionForStoreSlug, calendarBreaks, type ClassSession } from "@/lib/classSessions";
import { instructorNames } from "@/lib/instructors";
import type { StoreItem } from "@/lib/store";

// How many "TBD via voting" placeholder Wednesdays to show after the named
// 8-week run — the full back half of 2026 exists too, but listing all of it
// would dwarf the real, bookable calendar above it. The remainder is exactly
// what /vote is for.
const TBD_SLOTS_SHOWN = 2;

function formatSessionDate(iso: string): { weekday: string; date: string; time: string } {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" }).toUpperCase();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).toUpperCase();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" }).replace(" ", "").toLowerCase();
  return { weekday, date, time };
}

export default function TrainingCalendar() {
  const lastDated = wednesdayCalendar[wednesdayCalendar.length - 1]?.sessionDateISO;
  const tbdDates = lastDated ? upcomingTbdWednesdays(lastDated, TBD_SLOTS_SHOWN) : [];
  const now = Date.now();
  // Only what's still ahead. Finished classes used to stay in this grid as
  // "already happened" cards — eight of them, ahead of anything bookable.
  // They now live on /classes, each with its own page and summary.
  type Entry = { at: string; item?: StoreItem; live?: ClassSession };
  const entries: Entry[] = [
    ...wednesdayCalendar
      .filter((i) => Date.parse(i.sessionDateISO!) > now)
      .map((item) => ({ at: item.sessionDateISO!, item })),
    ...upcomingSessions(now)
      .filter((x) => x.kind === "livestream")
      .map((live) => ({ at: live.startsISO, live })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const breakFor = (iso: string) => calendarBreaks.find((b) => iso.startsWith(b.dateISO));

  return (
    <Reveal delay={20}>
      <section id="calendar" className="mt-10 scroll-mt-28">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">The Wednesday calendar</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Book any class, <span className="grad-text">right now.</span>
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-mist">
          Live and interactive over Zoom, 11a ET, two hours — follow along, ask questions, this
          isn&apos;t a webinar. Some sessions include reference files sent before class. Can&apos;t
          make it live? The price already includes all class material and a full recording of the
          session — nothing extra to buy.
        </p>
        <p className="mt-3 max-w-3xl rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm font-bold text-snow">
          Prices below are shown before the discount — enter code <span className="text-teal">UE5</span> at
          checkout for 50% off.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-mist">
          After this run, what&apos;s taught next is decided by{" "}
          <Link href="/vote" className="text-snow underline decoration-teal/50 hover:decoration-teal">
            vote
          </Link>{" "}
          — members&apos; votes count for more, scaled to their tier.
        </p>
        <Link
          href="/members"
          className="mt-3 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-grape/40 bg-grape/10 px-4 py-3 text-sm transition-colors hover:border-grape/70 hover:bg-grape/15"
        >
          <span className="rounded-full bg-grape px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0a0a12]">
            Cheapest way in!
          </span>
          <span className="font-bold text-snow">Become a member!</span>
          <span className="text-mist">
            {STARTER_TIER.monthlyCredits} classes a month for{" "}
            {formatPrice(STARTER_TIER.priceCents)} — cheaper than buying them one at a time, plus
            every recording and a bigger vote →
          </span>
        </Link>

        <div className="mt-8 -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {/* Pinned Friday office-hours card — standing, not date-locked. */}
          <div className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-amber/30 p-5 sm:w-auto">
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber">Every Friday · 1p ET</p>
            <h3 className="mt-2 font-bold leading-snug">{officeHoursDropIn.name}</h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{officeHoursDropIn.blurb}</p>
            <p className="mt-3 text-lg font-bold text-snow">{formatPrice(officeHoursDropIn.priceCents)}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist">{officeHoursDropIn.priceNote}</p>
            <div className="mt-4">
              <BuyButton slug={officeHoursDropIn.slug} label="Book a Friday →" itemName={officeHoursDropIn.name} />
            </div>
          </div>

          {/* Pinned 1-hour consultation card — standing, not date-locked.
              Price is deliberately not shown here (see StoreItem.hidePrice);
              it's the real amount on the Stripe Checkout page that follows. */}
          <div className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-grape/30 p-5 sm:w-auto">
            <p className="font-mono text-[10px] uppercase tracking-widest text-grape">Book anytime</p>
            <h3 className="mt-2 font-bold leading-snug">{consultationDropIn.name}</h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{consultationDropIn.blurb}</p>
            <p className="mt-3 text-xs leading-relaxed text-mist">{consultationDropIn.priceNote}</p>
            <div className="mt-4">
              <BuyButton
                slug={consultationDropIn.slug}
                label="Book a consultation →"
                itemName={consultationDropIn.name}
              />
            </div>
          </div>

          {entries.map(({ item, live }) => {
            if (live) {
              const { weekday, date, time } = formatSessionDate(live.startsISO);
              return (
                <div
                  key={live.slug}
                  className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-amber/40 p-5 sm:w-auto"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-amber">
                    {weekday}, {date} · {time} ET · Free
                  </p>
                  <h3 className="mt-2 font-bold leading-snug">
                    <Link href={`/classes/${live.slug}`} className="hover:text-teal">
                      {live.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-snow">Livestream on YouTube with {instructorNames(live.instructorIds)}</p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{live.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={live.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                    >
                      Watch live →
                    </a>
                    <Link href={`/classes/${live.slug}`} className="px-2 py-2.5 text-sm text-mist hover:text-teal">
                      Details
                    </Link>
                  </div>
                </div>
              );
            }
            const cls = item!;
            const { weekday, date, time } = formatSessionDate(cls.sessionDateISO!);
            const purchasable = isPurchasable(cls);
            const page = sessionForStoreSlug(cls.slug);
            return (
              <div
                key={cls.slug}
                className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-teal/20 p-5 sm:w-auto"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-teal">
                  {weekday}, {date} · {time} ET
                </p>
                <h3 className="mt-2 font-bold leading-snug">
                  {page ? (
                    <Link href={`/classes/${page.slug}`} className="hover:text-teal">
                      {cls.name}
                    </Link>
                  ) : (
                    cls.name
                  )}
                </h3>
                {page && <p className="mt-1 text-xs text-snow">with {instructorNames(page.instructorIds)}</p>}
                <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{cls.blurb}</p>
                {purchasable ? (
                  <>
                    <p className="mt-3 text-lg font-bold text-snow">{formatPrice(cls.priceCents)}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <BuyButton slug={cls.slug} label="Book this class →" itemName={cls.name} />
                      {page && (
                        <Link href={`/classes/${page.slug}`} className="px-2 py-2.5 text-sm text-mist hover:text-teal">
                          Details
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-mist">{cls.saleWindow?.closedNote}</p>
                )}
              </div>
            );
          })}

          {tbdDates.map((iso) => {
            const { weekday, date } = formatSessionDate(iso);
            const off = breakFor(iso);
            if (off) {
              return (
                <div
                  key={iso}
                  className="flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-dashed border-line p-5 sm:w-auto"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
                    {weekday}, {date}
                  </p>
                  <h3 className="mt-2 font-bold leading-snug text-mist">{off.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{off.note}</p>
                </div>
              );
            }
            return (
              <Link
                key={iso}
                href="/vote"
                className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-line p-5 transition-colors hover:border-grape/40 sm:w-auto"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-mist">
                  {weekday}, {date}
                </p>
                <h3 className="mt-2 font-bold leading-snug text-mist">Class TBD via voting!</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">
                  Not scheduled yet — the topic comes straight from the vote.
                </p>
                <span className="mt-4 font-mono text-xs text-grape">Vote on what&apos;s next →</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/classes"
          className="mt-2 inline-block text-sm text-snow underline decoration-teal/50 hover:decoration-teal"
        >
          Missed one? Every past class has its own page — what we covered, and the recording for members →
        </Link>
        <p className="mt-2 text-xs leading-relaxed text-mist">
          Dates and topics are subject to change — if a session moves, swap to any other class anytime or get a
          refund. Student or between jobs? Email for a sliding-scale seat, no questions asked.
        </p>
      </section>
    </Reveal>
  );
}
