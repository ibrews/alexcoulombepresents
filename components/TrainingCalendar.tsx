import Link from "next/link";
import Reveal from "@/components/Reveal";
import BuyButton from "@/components/BuyButton";
import { wednesdayCalendar, officeHoursDropIn, formatPrice, isPurchasable } from "@/lib/store";

// How many "TBD via voting" placeholder Wednesdays to show after the named
// 8-week run — the full back half of 2026 exists too, but listing all of it
// would dwarf the real, bookable calendar above it. The remainder is exactly
// what /vote is for.
const TBD_SLOTS_SHOWN = 3;

function formatSessionDate(iso: string): { weekday: string; date: string; time: string } {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" }).toUpperCase();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).toUpperCase();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "America/New_York" }).replace(" ", "").toLowerCase();
  return { weekday, date, time };
}

// Wednesdays strictly after the last dated item in `wednesdayCalendar`,
// through the end of that same calendar year — the fixed schedule owns its
// own run of weeks regardless of when this renders; this just continues the
// sequence.
function upcomingTbdWednesdays(afterISO: string, count: number): string[] {
  const last = new Date(afterISO);
  const year = last.getUTCFullYear();
  const out: string[] = [];
  const cursor = new Date(last);
  while (out.length < count) {
    cursor.setUTCDate(cursor.getUTCDate() + 7);
    if (cursor.getUTCFullYear() !== year) break;
    out.push(cursor.toISOString());
  }
  return out;
}

export default function TrainingCalendar() {
  const lastDated = wednesdayCalendar[wednesdayCalendar.length - 1]?.sessionDateISO;
  const tbdDates = lastDated ? upcomingTbdWednesdays(lastDated, TBD_SLOTS_SHOWN) : [];

  return (
    <Reveal delay={20}>
      <section id="calendar" className="mt-10 scroll-mt-28">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">The Wednesday calendar</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
          Book any class, <span className="grad-text">right now.</span>
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-mist">
          Live, 11a ET, two hours — every session includes the recording, even if you can&apos;t make it
          live. Use code <strong className="text-snow">UE5</strong> at checkout for 50% off this
          introductory run. After it, what&apos;s taught next is decided by{" "}
          <Link href="/vote" className="text-snow underline decoration-teal/50 hover:decoration-teal">
            vote
          </Link>{" "}
          — members&apos; votes count for more, scaled to their tier.
        </p>

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

          {wednesdayCalendar.map((item) => {
            const { weekday, date, time } = formatSessionDate(item.sessionDateISO!);
            const purchasable = isPurchasable(item);
            return (
              <div
                key={item.slug}
                className="glass flex w-[85vw] shrink-0 snap-start flex-col rounded-2xl border border-teal/20 p-5 sm:w-auto"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-teal">
                  {weekday}, {date} · {time} ET
                </p>
                <h3 className="mt-2 font-bold leading-snug">{item.name}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-mist">{item.blurb}</p>
                {purchasable ? (
                  <>
                    <p className="mt-3 text-lg font-bold text-snow">{formatPrice(item.priceCents)}</p>
                    <div className="mt-4">
                      <BuyButton slug={item.slug} label="Book this class →" itemName={item.name} />
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-mist">{item.saleWindow?.closedNote}</p>
                )}
              </div>
            );
          })}

          {tbdDates.map((iso) => {
            const { weekday, date } = formatSessionDate(iso);
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

        <p className="mt-2 text-xs leading-relaxed text-mist">
          Dates and topics are subject to change — if a session moves, swap to any other class anytime or get a
          refund. Student or between jobs? Email for a sliding-scale seat, no questions asked.
        </p>
      </section>
    </Reveal>
  );
}
