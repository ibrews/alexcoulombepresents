import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import VoteForm from "@/components/VoteForm";

export const metadata: Metadata = {
  title: "Vote: What Should Alex Teach Next?",
  description:
    "Pick up to two Unreal Engine topics you want taught next — Blueprints, VR/Vision Pro, MetaHumans, Archviz, PCG, Mocap, Unity migration, export pipelines, AI-assisted workflows, Virtual Production, or write in your own. The winner gets taught next.",
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
          No survey theater — the most-requested topic becomes what&apos;s taught after the current
          calendar wraps. Pick up to two (or write in your own), drop your email, and watch the
          results move. A vote is a promise Alex will actually build it.
        </p>
        <p className="mt-3 text-sm text-mist">
          <Link href="/members" className="text-snow underline decoration-teal/50 hover:decoration-teal">
            Members
          </Link>{" "}
          vote with extra weight, scaled to tier — 2x, 4x, or 10x a normal vote.
        </p>
      </Reveal>

      <Reveal delay={80} className="mt-10">
        <VoteForm />
      </Reveal>
    </div>
  );
}
