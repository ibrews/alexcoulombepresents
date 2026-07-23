import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import VoteForm from "@/components/VoteForm";

export const metadata: Metadata = {
  title: "Vote: What Should Alex Teach Next?",
  description:
    "Pick up to two Unreal Engine topics you want taught next — Blueprints, VR/Vision Pro, MetaHumans, Archviz, AI-assisted workflows, or Virtual Production. The winner becomes the September cohort.",
  alternates: { canonical: "/vote" },
};

export default function Vote() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/vote</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          What should Alex teach <span className="grad-text">next?</span>
        </h1>
        <p className="mt-6 leading-relaxed text-mist">
          No survey theater — the most-requested topic becomes the September cohort. Pick up to
          two, drop your email, and watch the results move. A vote is a promise I&apos;ll actually
          build it.
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-10">
        <VoteForm />
      </Reveal>
    </div>
  );
}
