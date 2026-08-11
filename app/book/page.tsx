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
    "Book a one-hour, one-on-one session with Alex Coulombe — go over a project, unstick a pipeline, scope a build, or talk career. Request a time; you only pay once it's confirmed.",
  alternates: { canonical: "/book" },
};

export default function Book() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/book</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Book <span className="grad-text">an hour.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          One focused hour, one-on-one, on whatever you need — going over a project, unsticking a
          pipeline, scoping a build, career advice. Live over video with screen share.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          Pick a time and send a request. Alex confirms it personally, and only then do you pay —
          so you&apos;re never charged for a slot he can&apos;t make.
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <BookingPicker />
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
