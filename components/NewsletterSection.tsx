import Reveal from "@/components/Reveal";
import WaitlistForm from "@/components/WaitlistForm";

/**
 * Generic low-commitment email capture — the "just keep me posted" list for
 * visitors who aren't ready to pick an AI or Unreal track yet. Drop it near
 * the bottom of any high-traffic page.
 */
export default function NewsletterSection({
  heading = "Be the first to hear what's new.",
  sub = "Class announcements. Upcoming events. Day one lab launches. Voting on new products and courses. One email every few weeks so you don't have to keep up with Alex's flutter of social media posts.",
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
