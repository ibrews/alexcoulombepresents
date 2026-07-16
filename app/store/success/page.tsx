import type { Metadata } from "next";
import Link from "next/link";
import { storeItems } from "@/lib/store";
import { findDigitalProduct } from "@/lib/commerce/products";
import { renderBreaks } from "@/components/Lines";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = { title: "Thank you!" };

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; sku?: string }>;
}) {
  const { item: slug, sku } = await searchParams;
  const item = storeItems.find((i) => i.slug === slug);
  const digital = sku ? findDigitalProduct(sku) : undefined;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-sm text-teal">payment received ✓</p>
      <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
        You just funded <span className="grad-text">more weird experiments.</span>
      </h1>
      <p className="mt-5 max-w-md text-mist">
        {digital ? (
          <>
            <span className="text-snow">{digital.name}</span> is yours. Check your email for the
            license key and a sign-in link to{" "}
            <Link className="text-teal hover:underline" href="/account">
              your account
            </Link>{" "}
            — the download button is there. Nothing in the inbox after a few minutes? Email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>
            .
          </>
        ) : item ? (
          <>
            <span className="text-snow">{item.name}</span> is yours. {renderBreaks(item.delivery)} If anything
            doesn&apos;t arrive within the hour, email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>{" "}
            and a human (the human, actually) will fix it.
          </>
        ) : (
          <>
            Your receipt is in your inbox. Delivery details follow shortly — and if anything
            looks off, email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>
            .
          </>
        )}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-snow px-6 py-3 font-semibold text-ink transition-transform hover:scale-[1.03]"
        >
          Back to the site →
        </Link>
        <Link
          href="/account"
          className="rounded-full border border-line px-6 py-3 font-semibold transition-colors hover:border-teal/60"
        >
          Your account →
        </Link>
      </div>

      {/* A buyer is the warmest possible lead — offer the newsletter here. */}
      <div className="mt-12 w-full max-w-md">
        <p className="text-sm text-mist">
          Want to hear when new classes, tools, and member perks drop?
        </p>
        <div className="mt-4">
          <WaitlistForm
            list="newsletter"
            cta="Join the newsletter →"
            successTitle="You're in."
            successMessage="New classes and launches, straight to your inbox."
            compact
          />
        </div>
      </div>
    </div>
  );
}
