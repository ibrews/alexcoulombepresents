import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import { customerFromSession } from "@/lib/commerce/tokens";
import { isMember } from "@/lib/commerce/membership";
import { labTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Lab Tools",
  description: "The members' Lab tools library.",
  robots: { index: false }, // members-only — nothing here for crawlers
};

// The Lab tools library is gated on the `membership` entitlement, but everyone
// gets the same teaser: tool name, tagline, description, and status. Only the
// "how to get it" access details are held back until you're a signed-in
// member — so the page sells the benefit instead of just blocking the door.
export default async function Tools() {
  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const member = customerId ? await isMember(customerId).catch(() => false) : false;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Reveal>
        <p className="font-mono text-sm text-teal">/members/tools</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">The Lab tools library</h1>
        <p className="mt-4 max-w-2xl text-mist">
          Real internal tools, delivered to members as they are ready to use.
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
                : "Below is every tool currently shipping to members. Sign in if you're already a member, or join the waitlist to get access when membership opens."}
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
        {labTools.map((tool, i) => (
          <Reveal key={tool.slug} delay={Math.min(i * 60, 240)}>
            <div className="glass rounded-2xl p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{tool.name}</h2>
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    tool.status === "shipping"
                      ? "border-teal/60 text-teal"
                      : "border-line text-mist"
                  }`}
                >
                  {tool.status === "shipping" ? "shipping" : "coming soon"}
                </span>
              </div>
              <p className="mt-3 text-lg leading-relaxed text-snow">{tool.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-mist">{tool.description}</p>
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-teal">How to get it</h3>
                {member ? (
                  <p className="mt-2 text-sm leading-relaxed text-mist">{tool.accessNote}</p>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-mist">
                    <Link href="/members" className="text-teal hover:underline">
                      Members
                    </Link>{" "}
                    get the access instructions for this tool right here.
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
