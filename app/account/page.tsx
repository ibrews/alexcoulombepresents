import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { customerFromSession } from "@/lib/commerce/tokens";
import { entitlementsForCustomer, getCustomer } from "@/lib/commerce/entitlements";
import { findDigitalProduct } from "@/lib/commerce/products";
import { MEMBERSHIP_SKU, BOOKING_CREDIT_SKU } from "@/lib/commerce/membership";
import LoginForm from "./LoginForm";
import CopyableCode from "@/components/CopyableCode";

export const metadata: Metadata = { title: "My account" };

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken);

  if (!customerId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 pt-32 text-center">
        <p className="font-mono text-sm text-teal">/account</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in to your account</h1>
        <p className="mt-4 text-sm text-mist">
          Enter the email you purchased with — we&apos;ll send a sign-in link.
        </p>
        <LoginForm />
      </div>
    );
  }

  const [entitlements, customer, { portal }] = await Promise.all([
    entitlementsForCustomer(customerId),
    getCustomer(customerId),
    searchParams,
  ]);

  // Membership + booking credits render as one membership card, not as
  // purchase rows (their skus have no product page or download).
  const now = Date.now();
  const notLapsed = (until: string | null) => !until || new Date(until).getTime() > now;
  const membership = entitlements.find((e) => e.sku === MEMBERSHIP_SKU);
  const membershipActive = !!membership && membership.status === "active" && notLapsed(membership.updates_until);
  const creditsAvailable = entitlements.filter(
    (e) => e.sku === BOOKING_CREDIT_SKU && e.status === "active" && notLapsed(e.updates_until)
  ).length;
  const purchases = entitlements.filter(
    (e) => e.sku !== MEMBERSHIP_SKU && e.sku !== BOOKING_CREDIT_SKU
  );

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-teal">/account</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Your purchases</h1>
        </div>
        <form action="/api/account/logout" method="post">
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 font-mono text-xs text-mist transition-colors hover:border-teal/60 hover:text-snow"
          >
            Sign out
          </button>
        </form>
      </div>

      {membership && (
        <div
          className={`mt-10 rounded-2xl p-7 ${
            membershipActive ? "glow-card border border-teal/40" : "glass"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold">Membership</h2>
            <span
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                membershipActive ? "border-teal/60 text-teal" : "border-line text-mist"
              }`}
            >
              {membershipActive ? "active" : membership.status === "active" ? "lapsed" : membership.status}
            </span>
          </div>
          {membershipActive ? (
            <>
              <p className="mt-3 text-sm text-mist">
                {creditsAvailable} class credit{creditsAvailable === 1 ? "" : "s"} available this cycle
                {membership.updates_until
                  ? ` · paid through ${new Date(membership.updates_until).toLocaleDateString()}`
                  : ""}
                . Credits are honored when you book — just sign up for any open class.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/members/recordings"
                  className="rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                >
                  Recording library →
                </Link>
                {customer?.stripe_customer_id && (
                  <form action="/api/account/portal" method="post">
                    <button
                      type="submit"
                      className="rounded-full border border-line px-5 py-2 text-sm text-mist transition-colors hover:border-teal/60 hover:text-snow"
                    >
                      Manage billing
                    </button>
                  </form>
                )}
              </div>
              {portal === "unavailable" && (
                <p className="mt-3 text-xs text-mist">
                  Billing portal is briefly unavailable — try again in a minute, or email{" "}
                  <a href="mailto:info@alexcoulombepresents.com" className="text-teal hover:underline">
                    info@alexcoulombepresents.com
                  </a>
                  .
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-mist">
              Your membership isn&apos;t active. Rejoin anytime from the{" "}
              <Link href="/members" className="text-teal hover:underline">
                members page
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {purchases.length === 0 && !membership && (
        <p className="mt-8 text-mist">Nothing here yet. Purchases appear within a minute of checkout.</p>
      )}

      <div className="mt-10 grid gap-5">
        {purchases.map((e) => {
          const product = findDigitalProduct(e.sku);
          return (
            <div key={e.id} className="glass rounded-2xl p-7">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-bold">{product?.name ?? e.sku}</h2>
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    e.status === "active" ? "border-teal/60 text-teal" : "border-line text-mist"
                  }`}
                >
                  {e.status}
                </span>
              </div>
              {e.status === "active" && product?.npmPackage ? (
                <div className="mt-4">
                  <p className="text-xs text-mist">Install:</p>
                  <CopyableCode value={`npm install -g ${product.npmPackage}`} />
                </div>
              ) : (
                e.status === "active" && (
                  <a
                    href={`/api/download?sku=${e.sku}`}
                    className="mt-4 inline-block rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                  >
                    Download →
                  </a>
                )
              )}
              {e.key_text && (
                <div className="mt-4">
                  <p className="text-xs text-mist">
                    License key{product?.npmPackage ? ` — activate with \`${product.npmPackage} license activate <key>\`` : ""}:
                  </p>
                  <CopyableCode value={e.key_text} />
                </div>
              )}
              <p className="mt-3 text-xs text-mist">
                v{e.major_version}
                {e.tier === "member"
                  ? " · membership perk — refreshes automatically while you're an active member"
                  : e.updates_until
                    ? ` · updates until ${new Date(e.updates_until).toLocaleDateString()}`
                    : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
