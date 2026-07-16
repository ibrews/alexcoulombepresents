import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribed" };

export default async function Unsubscribed({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; email?: string }>;
}) {
  const { ok, email } = await searchParams;
  const success = ok !== "0";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pt-32 text-center">
      <p className="font-mono text-sm text-teal">/unsubscribed</p>
      {success ? (
        <>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">You&apos;re unsubscribed.</h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            {email ? (
              <>
                <span className="text-snow">{email}</span> won&apos;t hear from this list again.
              </>
            ) : (
              "You won't hear from this list again."
            )}{" "}
            No hard feelings — you can always{" "}
            <Link href="/newsletter" className="text-teal hover:underline">
              come back
            </Link>{" "}
            later.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">That link didn&apos;t work.</h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            The unsubscribe link looks broken or expired. Email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>{" "}
            and it&apos;ll be handled by hand.
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-teal/60"
      >
        Back to the site →
      </Link>
    </div>
  );
}
