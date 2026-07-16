import Link from "next/link";
import Reveal from "@/components/Reveal";

/**
 * The "what next?" block for pages that used to dead-end (repos, about,
 * videos, links). Three routes onward: training, the studio, the newsletter.
 */
export default function CtaRow({
  heading = "Convinced? Here's where this goes.",
  sub = "The same techniques in these projects are what the live classes teach.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <Reveal>
      <div className="glass mt-20 rounded-3xl p-8 md:p-10">
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        <p className="mt-2 max-w-2xl text-sm text-mist">{sub}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link href="/training" className="rounded-2xl border border-teal/30 bg-teal/5 p-5 transition-colors hover:border-teal/60">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Learn it live</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Classes with an Epic Authorized Instructor — from $99 intro sessions to full curricula.
            </p>
          </Link>
          <a
            href="https://agilelens.com/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-grape/30 bg-grape/5 p-5 transition-colors hover:border-grape/60"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-grape">Hire the studio</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Agile Lens builds this stuff for clients — browse a decade of XR work, then get in touch.
            </p>
          </a>
          <Link href="/newsletter" className="rounded-2xl border border-amber/30 bg-amber/5 p-5 transition-colors hover:border-amber/60">
            <p className="font-mono text-xs uppercase tracking-widest text-amber">Stay in the loop</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              The newsletter: new classes, new tools, and launch discounts — no spam, ever.
            </p>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
