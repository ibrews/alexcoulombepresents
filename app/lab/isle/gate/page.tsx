import type { Metadata } from "next";
import Ethereal from "@/components/Ethereal";

export const metadata: Metadata = {
  title: "Isle Advisor Portal",
  robots: { index: false, follow: false },
};

export default async function IsleGate({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "unavailable"
      ? "This portal is not configured yet."
      : error
        ? "That password did not match. Try again."
        : null;

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 pt-24">
      <Ethereal variant="aurora" />
      <div className="glass relative rounded-3xl p-7 md:p-9">
        <p className="font-mono text-sm text-teal">/isle</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Advisor portal</h1>
        <p className="mt-3 leading-relaxed text-mist">Enter the shared password to continue.</p>

        {message ? (
          <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {message}
          </p>
        ) : null}

        <form action="/api/isle-portal/auth" method="post" className="mt-6 space-y-3">
          <label htmlFor="password" className="sr-only">
            Shared password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-full border border-line bg-transparent px-5 py-3 text-snow placeholder:text-mist focus:border-teal/60 focus:outline-none"
            placeholder="Shared password"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-teal px-6 py-3 font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Open portal →
          </button>
        </form>
      </div>
    </div>
  );
}
