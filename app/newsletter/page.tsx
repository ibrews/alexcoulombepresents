import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import WaitlistForm from "@/components/WaitlistForm";
import { getNewsletterIssues } from "@/lib/newsletters";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "One email when something real happens: new classes before they hit the store, Lab launches, membership news, and a vote on what gets taught next. Every issue archived here.",
  alternates: { canonical: "/newsletter" },
};

const whySubscribe = [
  {
    title: "First seat, best price.",
    detail:
      "Class announcements land here before the store — the August cohort's early-bird and the NEWSLETTER20 code went to subscribers first.",
  },
  {
    title: "A vote on what gets taught.",
    detail:
      "Issue #1 let readers pick the next topic. That's the standing deal: reply, and the most-requested class is the one Alex builds next.",
  },
  {
    title: "Lab launches, day one.",
    detail:
      "Several products are in active development. Subscribers hear when each one opens up — before any public post.",
  },
  {
    title: "The founding membership rate.",
    detail: "Members is coming with a founding price that only ever goes up. The number shows up here first.",
  },
];

export default function Newsletter() {
  const issues = getNewsletterIssues();
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/newsletter</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          One email when <span className="grad-text">something real happens.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          New classes before they hit the store, Lab launches, membership news, and whatever Alex
          learned the hard way that month. No drip campaigns, no &quot;just checking in&quot; —
          every issue lives on this page forever, so you can read a few before deciding it&apos;s
          earned the inbox slot.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-8 max-w-md">
          <WaitlistForm
            list="newsletter"
            withName
            cta="Subscribe →"
            successTitle="You're in."
            successMessage="Next time something worth an email happens, you'll know first."
          />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {whySubscribe.map((w) => (
            <div key={w.title} className="glass rounded-2xl p-5">
              <h2 className="font-bold text-snow">{w.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{w.detail}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-8 rounded-2xl border border-line p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">The studio side</p>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            The training and the tools come out of{" "}
            <a
              href="https://agilelens.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-snow underline decoration-amber/50 hover:decoration-amber"
            >
              Agile Lens
            </a>{" "}
            — the NYC studio Alex runs, where the team has shipped immersive work for the Royal
            Shakespeare Company, Four Seasons, NEOM, Samsung, and Royal Caribbean. This list is for
            classes and Lab launches; Agile Lens runs its own monthly newsletter for meetups,
            shows, demos, and beta tests — subscribe to that one separately at{" "}
            <a
              href="https://agilelens.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-snow underline decoration-amber/50 hover:decoration-amber"
            >
              agilelens.com/contact
            </a>
            .
          </p>
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
