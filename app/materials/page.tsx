import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import { customerFromSession } from "@/lib/commerce/tokens";
import { accessForCustomer, foldersFor } from "@/lib/commerce/materialAccess";

export const metadata: Metadata = {
  title: "Class Materials",
  description: "Slides, project files, and course content for each class.",
  robots: { index: false }, // gated — nothing here for crawlers
};

// The folder index. Everyone signed in sees WHAT exists and which folders
// they can open; the files themselves stay behind /api/materials. Showing
// locked folders is deliberate — it's how a single-class buyer discovers the
// membership is worth it, and it matches how /members/decks already behaves.
export default async function Materials() {
  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const access = await accessForCustomer(customerId);
  const folders = foldersFor(access);
  const openCount = folders.filter((f) => f.open).length;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Reveal>
        <p className="font-mono text-sm text-teal">/materials</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Class materials</h1>
        <p className="mt-4 max-w-2xl text-mist">
          One folder per class — slides, project files, and course content. Sign up for a class and
          its folder opens for you; members get every folder, including the cross-class library.
        </p>
      </Reveal>

      {!customerId && (
        <Reveal delay={40}>
          <div className="glow-card mt-8 max-w-2xl rounded-2xl border border-teal/40 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">
              Sign in to open your folders
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Use the email you bought your class with — access is tied to your order, so there is
              nothing to redeem.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/account"
                className="rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                Sign in →
              </Link>
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

      {customerId && !access.member && openCount === 0 && (
        <Reveal delay={40}>
          <div className="glass mt-8 max-w-2xl rounded-2xl p-6">
            <p className="text-sm leading-relaxed text-mist">
              You&apos;re signed in, but this account doesn&apos;t have a class order or an active
              membership yet. If you bought a class with a different email address, sign in with
              that one instead.
            </p>
          </div>
        </Reveal>
      )}

      <div className="mt-10 grid gap-5">
        {folders.map(({ folder, open }, i) => (
          <Reveal key={folder.slug} delay={Math.min(i * 60, 240)}>
            <div className="glass rounded-2xl p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold">{folder.title}</h2>
                <span className="font-mono text-xs text-mist">
                  {folder.date
                    ? new Date(`${folder.date}T00:00:00`).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : folder.membersOnly
                      ? "Members"
                      : ""}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-mist">{folder.blurb}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-mist">
                {folder.materials.length} item{folder.materials.length === 1 ? "" : "s"}
              </p>
              <div className="mt-5 border-t border-line pt-5">
                {open ? (
                  <Link
                    href={`/materials/${folder.slug}`}
                    className="inline-block rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                  >
                    Open folder →
                  </Link>
                ) : (
                  <p className="text-sm leading-relaxed text-mist">
                    {folder.membersOnly ? (
                      <>
                        A{" "}
                        <Link href="/members" className="text-teal hover:underline">
                          membership
                        </Link>{" "}
                        opens this one.
                      </>
                    ) : (
                      <>
                        Locked —{" "}
                        <Link href="/store" className="text-teal hover:underline">
                          sign up for this class
                        </Link>{" "}
                        or{" "}
                        <Link href="/members" className="text-teal hover:underline">
                          join as a member
                        </Link>{" "}
                        to open it.
                      </>
                    )}
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
