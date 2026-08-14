import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Reveal from "@/components/Reveal";
import { customerFromSession } from "@/lib/commerce/tokens";
import { accessForCustomer, canOpen } from "@/lib/commerce/materialAccess";
import {
  classFolders,
  findClassFolder,
  materialAvailable,
  materialHref,
} from "@/lib/classMaterials";
import { recordings } from "@/lib/recordings";

export const metadata: Metadata = {
  title: "Class Materials",
  robots: { index: false },
};

export function generateStaticParams() {
  return classFolders.map((f) => ({ slug: f.slug }));
}

export default async function MaterialFolder({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const folder = findClassFolder(slug);
  if (!folder) notFound();

  const sessionToken = (await cookies()).get("acp_session")?.value;
  const customerId = await customerFromSession(sessionToken).catch(() => null);
  const access = await accessForCustomer(customerId);
  const open = canOpen(folder, access);
  const recording = folder.recordingSlug
    ? recordings.find((r) => r.slug === folder.recordingSlug)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Reveal>
        <Link href="/materials" className="font-mono text-sm text-teal hover:underline">
          ← /materials
        </Link>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{folder.title}</h1>
        {folder.date && (
          <p className="mt-2 font-mono text-xs text-mist">
            {new Date(`${folder.date}T00:00:00`).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <p className="mt-4 text-mist">{folder.blurb}</p>
      </Reveal>

      {!open ? (
        <Reveal delay={40}>
          <div className="glow-card mt-8 rounded-2xl border border-teal/40 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">
              {customerId ? "No access on this account" : "Sign in to open this folder"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              {folder.membersOnly
                ? "This folder is a membership benefit."
                : "This folder opens for anyone signed up for the class, and for members. If you bought it with a different email address, sign in with that one."}
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
      ) : (
        <div className="mt-10 grid gap-4">
          {folder.materials.map((m, i) => {
            const ready = materialAvailable(m);
            return (
              <Reveal key={m.key} delay={Math.min(i * 60, 240)}>
                <div className="glass rounded-2xl p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="font-bold">{m.label}</h2>
                    {m.sizeLabel && (
                      <span className="font-mono text-xs text-mist">{m.sizeLabel}</span>
                    )}
                  </div>
                  {m.note && <p className="mt-2 text-sm leading-relaxed text-mist">{m.note}</p>}
                  <div className="mt-4">
                    {ready ? (
                      <a
                        href={materialHref(folder.slug, m.key)}
                        className="inline-block rounded-full bg-snow px-5 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                      >
                        {m.source.kind === "external" ? "Open →" : "Download ↓"}
                      </a>
                    ) : (
                      // Never render a button that would 503. See
                      // materialAvailable() in lib/classMaterials.ts.
                      <p className="font-mono text-xs uppercase tracking-wider text-amber">
                        Uploading — not available yet
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {recording && (
        <Reveal>
          <div className="glass mt-8 rounded-2xl p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">The recording</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              This class was recorded — members can watch it in the{" "}
              <Link href="/members/recordings" className="text-teal hover:underline">
                recording library
              </Link>
              .
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
