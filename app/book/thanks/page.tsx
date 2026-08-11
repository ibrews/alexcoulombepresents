import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";

export const metadata: Metadata = {
  title: "You're booked",
  robots: { index: false },
};

// Stripe's success_url. Deliberately says nothing that depends on the webhook
// having already run — the confirmation email is sent from the webhook, which
// can land a moment after the redirect.
export default function BookingThanks() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/book</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          You&apos;re <span className="grad-text">booked.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-mist">
          Payment went through and the time is yours. A confirmation email is on its way — Alex
          will send the video link before the session.
        </p>
        <p className="mt-4 leading-relaxed text-mist">
          Need to move it, or want to send something over beforehand? Just reply to that email.
        </p>
        <a className="mt-8 inline-block text-teal hover:underline" href="/">
          ← Back to the site
        </a>
      </Reveal>
    </div>
  );
}
