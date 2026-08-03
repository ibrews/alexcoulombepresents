import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import { customerFromSession } from "@/lib/commerce/tokens";
import { isMember } from "@/lib/commerce/membership";
import { spatialDeckTalks } from "@/lib/decks";

export const metadata: Metadata = {
  title: "Spatial Deck Presentations",
  description: "The members' library of Alex's public Spatial Deck presentations, consolidated in one place.",
  robots: { index: false }, // members-only — nothing here for crawlers
};

// Same shape as /members/tools: everyone sees what's here and what it's
// about, only the deck link itself is held back until you're a signed-in
// member. These talks are already individually findable via /appearances —
// this is the consolidated, better-described version, as a member perk.
export default async function Decks() {
  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const member = customerId ? await isMember(customerId).catch(() => false) : false;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Reveal>
        <p className="font-mono text-sm text-teal">/members/decks</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Spatial Deck presentations</h1>
        <p className="mt-4 max-w-2xl text-mist">
          Alex's public talks, built and delivered in Spatial Deck — consolidated here instead of
          scattered one at a time across conference sites.
        </p>
      </Reveal>

      {!member && (
        <Reveal delay={40}>
          <div className="glow-card mt-8 max-w-2xl rounded-2xl border border-teal/40 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">
              {customerId ? "No active membership" : "Preview — sign in to unlock access"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              {customerId
                ? "Your account doesn't have an active membership yet — here's what's inside."
                : "Below is every deck in the library. Sign in if you're already a member, or join the waitlist to get access when membership opens."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {!customerId && (
                <Link
                  href="/account"
                  className="rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  Sign in →
                </Link>
              )}
              <Link
                href="/members"
                className="rounded-full border border-line px-5 py-2 text-sm text-mist transition-colors hover:border-teal/60 hover:text-snow"
              >
                About membership
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      <div className="mt-10 grid gap-5">
        {spatialDeckTalks.map((talk, i) => (
          <Reveal key={talk.slug} delay={Math.min(i * 60, 240)}>
            <div className="glass rounded-2xl p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{talk.title}</h2>
                <span className="font-mono text-xs text-mist">{talk.date}</span>
              </div>
              <p className="mt-1 text-sm text-mist">{talk.venue}</p>
              <p className="mt-3 text-sm leading-relaxed text-mist">{talk.summary}</p>
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-teal">Watch it</h3>
                {member ? (
                  <a
                    href={talk.deckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-teal hover:underline"
                  >
                    Open the deck →
                  </a>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-mist">
                    <Link href="/members" className="text-teal hover:underline">
                      Members
                    </Link>{" "}
                    get the deck link right here.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
