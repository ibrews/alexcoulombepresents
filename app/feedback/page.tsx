import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import TestimonialForm from "@/components/TestimonialForm";

export const metadata: Metadata = {
  title: "Share Your Feedback",
  description: "Took a class with Alex? One honest sentence helps more than you know.",
  alternates: { canonical: "/feedback" },
};

export default async function Feedback({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classContext } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="ghost" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/feedback</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Took a class? <span className="grad-text">One honest sentence</span> helps more than you
          know.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
          No survey, no ten questions — just what actually happened for you. Good, bad, or
          in-between. Alex reads every one of these himself.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="glass mt-10 rounded-2xl p-6 md:p-8">
          <TestimonialForm classContext={classContext} />
        </div>
      </Reveal>
    </div>
  );
}
