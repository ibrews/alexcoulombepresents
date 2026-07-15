import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import InterestForm from "@/components/InterestForm";
import { getNewsletterIssues } from "@/lib/newsletters";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Alex's occasional newsletter — classes, talks, new tools, and experiments. Every issue archived here.",
  alternates: { canonical: "/newsletter" },
};

export default function Newsletter() {
  const issues = getNewsletterIssues();
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/newsletter</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Occasional dispatches. <span className="grad-text">All archived here.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Classes, talks, new tools, and lab experiments — sent when there&apos;s something worth
          your inbox, never more. Every issue lives on this page forever, so you can link to it,
          skim it later, or decide whether it&apos;s worth subscribing at all.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-8 max-w-md">
          <InterestForm track="unreal" />
        </div>
      </Reveal>

      <div className="mt-14 space-y-4">
        {issues.map((issue, i) => (
          <Reveal key={issue.slug} delay={Math.min(i * 60, 240)}>
            <Link
              href={`/newsletter/${issue.slug}`}
              className="glass block rounded-2xl p-6 transition hover:border-teal/40"
            >
              <p className="font-mono text-xs text-mist">{issue.date}</p>
              <h2 className="mt-1 font-bold text-snow">{issue.title}</h2>
            </Link>
          </Reveal>
        ))}
        {issues.length === 0 && <p className="text-mist">First issue coming soon.</p>}
      </div>
    </div>
  );
}
