// --override — decision-citation-check false positive: "project review" here
// is a description of what the consultation covers (marketing copy), not a
// review or approval attributed to Alex.
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import BookingPicker from "@/components/BookingPicker";

export const metadata: Metadata = {
  title: "Book an appointment",
  description:
    "Book dedicated one-on-one time with Alex Coulombe — 1, 2, or 3 hours. Go over a project, unstick a pipeline, scope a build, or talk career. Request a time; you only pay once it's confirmed.",
  alternates: { canonical: "/book" },
};

export default function Book() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/book</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Book <span className="grad-text">the time.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Dedicated time, one-on-one, on whatever you need — going over a project, unsticking a
          pipeline, scoping a build, career advice. Live over video with screen share.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          Pick a block and send a request. Alex confirms it personally, and only then do you pay —
          so you&apos;re never charged for time he can&apos;t make, and never charged before
          he&apos;s sure he can actually help.
        </p>
      </Reveal>

      {/* Deliberately ABOVE the picker, not a footnote under it. Someone who
          isn't sure this is even the right call shouldn't have to work through
          a booking form to find out there's a lower-stakes way to ask. */}
      <Reveal>
        <div className="mt-10 rounded-3xl border border-teal/30 bg-teal/[0.07] p-6 md:p-8">
          <h2 className="text-lg font-semibold text-snow">Not sure yet? Just ask first.</h2>
          <p className="mt-3 leading-relaxed text-mist">
            You don&apos;t have to book anything to talk to Alex. If you&apos;d rather describe
            what you&apos;re working on and find out whether he&apos;s actually the right person
            for it — or whether a class or a shorter conversation would serve you better — email{" "}
            <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
              info@alexcoulombepresents.com
            </a>
            . It goes straight to him, and he&apos;ll tell you honestly if he can&apos;t help.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <BookingPicker />
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm leading-relaxed text-mist">
          <p className="font-semibold text-snow">How the time works</p>
          <p className="mt-2">
            Booked time is <strong className="text-snow">reserved</strong>, not metered. Alex holds
            the whole block for you and turns down other work in it, so it&apos;s charged in full
            whether you use all of it or finish early. If you book three hours and only need one,
            that&apos;s three hours — which is exactly why the longer blocks cost less per hour.
          </p>
          <p className="mt-3">
            <strong className="text-snow">Students and freelancers pay half</strong> — $150, $250,
            or $300. It&apos;s an honor-system question on the form, not a document upload. Alex
            sees which rate you picked before anything is charged, so if it&apos;s a stretch
            he&apos;ll just say so rather than quietly billing you full price.
          </p>
          <p className="mt-3">
            Need to move it? Reply to your confirmation email and Alex will do what he can. Life
            happens.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <p className="mt-8 text-sm text-mist/70">
          Looking for a class instead? The{" "}
          <a className="text-teal hover:underline" href="/training">
            training calendar
          </a>{" "}
          has open-enrollment sessions most Wednesdays, and{" "}
          <a className="text-teal hover:underline" href="/members">
            members
          </a>{" "}
          get them included.
        </p>
      </Reveal>
    </div>
  );
}
