import type { Metadata } from "next";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Video QA Workbench Beta Field Guide",
  description:
    "What Video QA Workbench measures, what stays local, and how an evidence-first render review beta will work.",
  alternates: { canonical: "/lab/video-qa-workbench/field-guide" },
  openGraph: {
    title: "Video QA Workbench — Evidence before opinion",
    description:
      "A local-first, evidence-first guide to render and video review.",
    url: "/lab/video-qa-workbench/field-guide",
    type: "website",
    images: [
      {
        url: "/video-qa-workbench-field-guide.png",
        width: 1731,
        height: 909,
        alt: "Video QA Workbench — Evidence before opinion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Video QA Workbench — Evidence before opinion",
    description:
      "A local-first, evidence-first guide to render and video review.",
    images: ["/video-qa-workbench-field-guide.png"],
  },
};

const sections = [
  {
    number: "01",
    title: "Start with evidence, not a score",
    body: "A review begins with measurable signals: frozen spans, black-frame candidates, sharpness and motion changes, cue alignment, and context around cuts. The workbench turns those into seekable timestamps and evidence frames. An alert is a reason to inspect, never a claim that a render is objectively good or bad.",
  },
  {
    number: "02",
    title: "Keep creative intent visible",
    body: "Technical signals, team preferences, creative candidates, ambiguous items, and timeline context are intentionally separate. A camera-speed house rule can be useful without pretending it is an objective defect. A human reviewer keeps the final call.",
  },
  {
    number: "03",
    title: "Compare the same shot, honestly",
    body: "For aligned stills and matched revision frames, the workbench maps changed regions, luma, color, and edge structure. The Shot matrix compares each platform only against its matching camera shot. It will not resize, auto-align, or name a renderer winner; wrong framing is evidence worth seeing.",
  },
  {
    number: "04",
    title: "Keep the media under your control",
    body: "The review worker, source playback, reports, and evidence stay local by default. Feedback records dispositions and missed issues locally. Any future telemetry or case-study contribution must be explicit, limited, and separate from the act of reviewing confidential footage.",
  },
  {
    number: "05",
    title: "Make feedback improve the next review",
    body: "Confirm, dismiss, mark intentional, flag a preference disagreement, or log a missed issue. The useful learning signal is not raw upload volume; it is a controlled record of what was helpful, ambiguous, or absent, tested again on separate clips before a behavior changes.",
  },
];

const limits = [
  "It is not an automated quality certification or a substitute for a creative review.",
  "It does not infer why two renders differ from pixels alone.",
  "It does not turn platform comparison into a single winner score.",
  "It does not silently repair camera, crop, pose, or timing mismatches.",
];

export default function VideoQAFieldGuide() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/lab/video-qa-workbench" className="font-mono text-sm text-mist hover:text-teal">
          ← Video QA Workbench
        </Link>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-teal">Beta field guide · local-first</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-7xl">
          Better review starts when the render can <span className="grad-text">show its work.</span>
        </h1>
        <p className="mt-7 max-w-3xl text-xl leading-relaxed text-mist">
          Video QA Workbench is being prepared as an invitation-only beta for teams who need more
          than a vague quality score—and less than another place their footage can escape.
        </p>
      </Reveal>

      <Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
          <div className="bg-ink p-7">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Today</p>
            <p className="mt-3 text-lg font-semibold">Local screening, evidence, and strict shot comparison.</p>
          </div>
          <div className="bg-ink p-7">
            <p className="font-mono text-xs uppercase tracking-widest text-amber">Beta promise</p>
            <p className="mt-3 text-lg font-semibold">A signed local package with a clear renewal path.</p>
          </div>
          <div className="bg-ink p-7">
            <p className="font-mono text-xs uppercase tracking-widest text-grape">Not a claim</p>
            <p className="mt-3 text-lg font-semibold">No mystery score, automatic approval, or renderer ranking.</p>
          </div>
        </div>
      </Reveal>

      <section className="mt-20 space-y-5">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist">How a review works</p>
        </Reveal>
        {sections.map((section, index) => (
          <Reveal key={section.number} delay={index * 70}>
            <article className="glass grid gap-5 rounded-3xl p-7 md:grid-cols-[5rem_1fr] md:p-10">
              <p className="font-mono text-sm text-teal">{section.number}</p>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                <p className="mt-3 max-w-3xl leading-relaxed text-mist">{section.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      <Reveal>
        <section className="mt-16 rounded-3xl border border-amber/35 bg-amber/5 p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Important limits</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">A useful beta should say where it stops.</h2>
          <ul className="mt-7 grid gap-4 md:grid-cols-2">
            {limits.map((limit) => (
              <li key={limit} className="flex gap-3 text-sm leading-relaxed text-mist">
                <span className="text-amber">✦</span>
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist">Availability</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">The signed beta is not open yet.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-mist">
            The first invitation wave opens only after the package, renewal path, clean-machine
            install, and support documentation are ready. If you review real renders repeatedly,
            you can raise your hand now.
          </p>
          <Link
            href="/lab/video-qa-workbench#waitlist"
            className="mt-7 inline-flex rounded-full bg-teal px-6 py-3 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            Join the early-access list →
          </Link>
          <Link href="/lab/video-qa-workbench/beta-handbook" className="ml-5 text-sm font-semibold text-teal hover:underline">
            Read the tester handbook →
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
