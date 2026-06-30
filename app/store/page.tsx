import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import InquireButton from "@/components/InquireButton";
import { storeItems } from "@/lib/store";
import { renderBreaks } from "@/components/Lines";

export const metadata: Metadata = {
  title: "Work With Alex — Courses, Skills & Templates",
  description:
    "Unreal Engine training, AI skills for Claude Code, and spatial computing templates. Reach out to get started.",
  alternates: { canonical: "/store" },
};

const kindLabel: Record<string, string> = {
  course: "Course",
  "course-bundle": "Course bundle",
  skill: "AI skill",
  template: "Template",
  "repo-access": "Repo access",
};

export default function Store() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/store</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Let&apos;s work together. <span className="grad-text">Get in touch to start.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          Training, AI skills, and spatial computing templates — all made by Alex, for people who
          want to move fast and build real things. Drop a line and we&apos;ll figure out the right
          format together.
        </p>
      </Reveal>

      {/* External storefronts */}
      <Reveal>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-mist">Also available at:</span>
          <a
            href="https://ibrews.gumroad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition-colors hover:border-teal/60 hover:text-snow"
          >
            Gumroad →
          </a>
          <a
            href="https://capafy.ai/publisher/alex-coulombe-presents"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition-colors hover:border-grape/60 hover:text-snow"
          >
            Capafy →
          </a>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {storeItems.map((item, i) => (
          <Reveal key={item.slug} delay={Math.min(i * 70, 280)}>
            <div className="glass flex h-full flex-col rounded-2xl p-7">
              <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-mist self-start">
                {kindLabel[item.kind]}
              </span>
              <h2 className="mt-4 font-bold leading-snug">{item.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-mist">{renderBreaks(item.blurb)}</p>
              <p className="mt-3 text-xs leading-relaxed text-mist">
                <span className="text-snow">You get:</span> {renderBreaks(item.delivery)}
              </p>
              <div className="mt-5">
                <InquireButton
                  label="Inquire →"
                  list="store"
                  context={item.name}
                  withMessage
                  successMessage={`Alex will be in touch about ${item.name}.`}
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <h2 className="text-xl font-bold">Not sure where to start?</h2>
          <div className="mt-5 grid gap-6 text-sm leading-relaxed text-mist md:grid-cols-3">
            <p>
              <span className="text-snow">Training.</span> From one intro session to a full
              eleven-class curriculum — live, on your schedule, using your own project as the
              sandbox.
            </p>
            <p>
              <span className="text-snow">Skills and templates.</span> Installable Claude Code
              skills and Unreal templates also live on{" "}
              <a className="text-teal hover:underline" href="https://capafy.ai/publisher/alex-coulombe-presents" target="_blank" rel="noopener noreferrer">
                Capafy
              </a>{" "}
              and{" "}
              <a className="text-teal hover:underline" href="https://ibrews.gumroad.com" target="_blank" rel="noopener noreferrer">
                Gumroad
              </a>
              .
            </p>
            <p>
              <span className="text-snow">Custom work.</span> Pilot projects,
              collaborations, and studio pipelines — email{" "}
              <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
                info@alexcoulombepresents.com
              </a>{" "}
              or use the{" "}
              <a className="text-teal hover:underline" href="/contact">
                contact form
              </a>
              .
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
