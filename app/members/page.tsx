import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import WaitlistForm from "@/components/WaitlistForm";
import JoinMembershipButton from "@/components/JoinMembershipButton";
import { customerFromSession } from "@/lib/commerce/tokens";
import { isMember, memberBenefits, MEMBERSHIP_LIVE, MEMBERSHIP_PRICE_LABEL } from "@/lib/commerce/membership";

export const metadata: Metadata = {
  title: "Members — Coming Soon",
  description:
    "The Alex Coulombe Presents membership: every class recording, member pricing, early Lab access, monthly office hours, and a vote on what gets taught next. Join the founding waitlist.",
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
  const member = customerId ? await isMember(customerId).catch(() => false) : false;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
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
          One membership, everything behind the curtain: the full class-recording library, standing
          member pricing, first access to Lab launches, and a monthly hour where you get Alex&apos;s
          full attention.{" "}
          {MEMBERSHIP_LIVE
            ? `${MEMBERSHIP_PRICE_LABEL} — cancel anytime.`
            : "Pricing lands with the launch — waitlist members hear first and get the founding rate."}
        </p>
      </Reveal>

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

      {member ? (
        <Reveal>
          <div className="glow-card mt-14 rounded-3xl border border-teal/40 p-8 text-center md:p-10">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Membership active ✓</p>
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
      ) : MEMBERSHIP_LIVE ? (
        <Reveal>
          <div className="glass mt-14 rounded-3xl p-8 text-center md:p-12">
            {joined === "1" ? (
              <>
                <p className="font-mono text-xs uppercase tracking-widest text-teal">
                  Payment received ✓
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">You&apos;re in — welcome.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist">
                  Your membership activates automatically — usually instant. Check your email for a
                  sign-in link, or refresh this page in a moment. Nothing after a few minutes? Email{" "}
                  <a
                    href="mailto:info@alexcoulombepresents.com"
                    className="text-teal hover:underline"
                  >
                    info@alexcoulombepresents.com
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight">Join the membership.</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-mist">
                  {MEMBERSHIP_PRICE_LABEL} — 2 live-class credits every billing cycle, the full
                  recording library, member pricing, and everything above. Cancel anytime from your
                  account.
                </p>
                <div className="mt-6">
                  <JoinMembershipButton />
                </div>
              </>
            )}
          </div>
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
    </div>
  );
}
