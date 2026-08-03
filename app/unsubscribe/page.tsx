import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribe",
  // Never index the opt-out form itself.
  robots: { index: false, follow: false },
};

// Typed-address unsubscribe. The one-click links in individually-addressed
// emails carry an HMAC token and skip this page entirely; this exists for
// sends that can't carry a per-recipient link (a BCC batch, a forwarded
// issue) so "stop emailing me" always has a working path.
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="font-mono text-sm text-teal">/unsubscribe</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Unsubscribe</h1>
      <p className="mt-4 text-sm leading-relaxed text-mist">
        Enter the address you receive the newsletter at and you&apos;ll be removed from every
        list — immediately, no confirmation step.
      </p>

      {err ? (
        <p className="mt-5 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          That didn&apos;t look like a valid email address. Try again?
        </p>
      ) : null}

      <form action="/api/unsubscribe" method="post" className="mt-6 flex w-full flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-full border border-line bg-transparent px-5 py-3 text-center text-snow placeholder:text-mist focus:border-teal/60 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-full bg-teal px-6 py-3 font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Unsubscribe me
        </button>
      </form>

      <p className="mt-6 text-xs leading-relaxed text-mist">
        Trouble? Email{" "}
        <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
          info@alexcoulombepresents.com
        </a>{" "}
        and it&apos;ll be handled by hand.
      </p>

      <Link
        href="/"
        className="mt-8 rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-teal/60"
      >
        Back to the site →
      </Link>
    </div>
  );
}
