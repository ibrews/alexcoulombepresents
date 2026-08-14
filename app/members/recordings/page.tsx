import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import { customerFromSession } from "@/lib/commerce/tokens";
import { isMember } from "@/lib/commerce/membership";
import { recordings } from "@/lib/recordings";

export const metadata: Metadata = {
  title: "Recording Library",
  description: "The members' class-recording library.",
  robots: { index: false }, // members-only — nothing here for crawlers
};

// The recordings library — membership launch checklist step 3. Gated on the
// `membership` entitlement (comped members included, live before the public
// launch flag flips). Interim delivery is a gated list of links; the HLS-on-R2
// player replaces the links later (business plan §2.6).
export default async function Recordings() {
  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const member = customerId ? await isMember(customerId).catch(() => false) : false;

  if (!member) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pt-32 text-center">
        <p className="font-mono text-sm text-teal">/members/recordings</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Members only</h1>
        <p className="mt-4 text-sm leading-relaxed text-mist">
          The recording library is a membership benefit.{" "}
          {customerId
            ? "Your account doesn't have an active membership."
            : "Sign in first if you're already a member."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
    );
  }

  const sorted = [...recordings].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Reveal>
        <p className="font-mono text-sm text-teal">/members/recordings</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">The recording library</h1>
        <p className="mt-4 max-w-2xl text-mist">
          Every class recording, including the sessions you didn&apos;t attend — plus the archive of
          earlier free training, multi-day workshops, and conference talks. New recordings land here
          after each live class.
        </p>
      </Reveal>

      {sorted.length === 0 ? (
        <Reveal>
          <div className="glass mt-10 rounded-2xl p-8 text-center">
            <p className="font-bold">Nothing here yet — but not for long.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-mist">
              The library fills as classes run; every upcoming session gets recorded. Check the{" "}
              <Link href="/training" className="text-teal hover:underline">
                training calendar
              </Link>{" "}
              for what&apos;s next.
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 grid gap-5">
          {sorted.map((r, i) => (
            <Reveal key={r.slug} delay={Math.min(i * 60, 240)}>
              <div className="glass grid gap-6 rounded-2xl p-7 sm:grid-cols-[minmax(0,14rem)_1fr]">
                {r.youtubeId && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl border border-line transition-transform hover:scale-[1.02]"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                  </a>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-bold">{r.title}</h2>
                    <p className="font-mono text-xs text-mist">
                      {r.dateLabel ??
                        new Date(`${r.recordedAt}T00:00:00`).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      {r.durationMin ? ` · ${r.durationMin} min` : ""}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{r.description}</p>
                  {r.topics && r.topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                    >
                      Watch →
                    </a>
                    {r.materials?.map((m) => (
                      <a
                        key={m.href}
                        href={m.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal hover:underline"
                      >
                        {m.label} ↓
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
