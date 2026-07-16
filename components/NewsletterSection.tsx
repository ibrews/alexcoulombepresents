import Reveal from "@/components/Reveal";
import WaitlistForm from "@/components/WaitlistForm";

/**
 * Generic low-commitment email capture — the "just keep me posted" list for
 * visitors who aren't ready to pick an AI or Unreal track yet. Drop it near
 * the bottom of any high-traffic page.
 */
export default function NewsletterSection({
  heading = "Hear about it before it's sold out.",
  sub = "Class announcements before the store, Lab launches on day one, the founding membership rate, and a vote on what gets taught next. One email when something real happens — usually not even monthly.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <Reveal>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="glass rounded-3xl p-8 text-center md:p-12">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">The newsletter</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{heading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-mist">{sub}</p>
          <div className="mx-auto mt-6 max-w-md">
            <WaitlistForm
              list="newsletter"
              cta="Subscribe →"
              successTitle="You're in."
              successMessage="You'll hear the moment there's something worth sharing."
              compact
            />
          </div>
        </div>
      </section>
    </Reveal>
  );
}
