import type { Metadata } from "next";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Video QA Workbench Beta Handbook",
  description: "Installation, local-data, renewal, support, and cleanup guidance for invited Video QA Workbench beta testers.",
  alternates: { canonical: "/lab/video-qa-workbench/beta-handbook" },
};

const steps = [
  ["Install", "Invited testers receive a signed DMG privately. Open it, drag Video QA Workbench to Applications, then open it normally. The first launch opens a local review room in your browser."],
  ["Enroll", "The app shows a random local installation code when it needs a license. Send only that code to the beta contact; you receive a signed renewal JSON to install locally. Never send footage, report files, or screenshots to renew."],
  ["Review", "Drop in a video, aligned still set, or declared shot matrix. Findings are evidence for inspection, not a quality score or automatic approval. Confirm, dismiss, mark intentional, flag a preference disagreement, or add a missed issue."],
  ["Renew", "Beta licenses last 30 days and warn before expiry. Expiry blocks new analyses but preserves existing local source files, reports, evidence, and export. Importing an invalid renewal never replaces a working license."],
];

export default function VideoQABetaHandbook() {
  return <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
    <Ethereal variant="nebula" />
    <Reveal>
      <Link href="/lab/video-qa-workbench/field-guide" className="font-mono text-sm text-mist hover:text-teal">← Beta field guide</Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-teal">Invited tester handbook</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">A private beta should be <span className="grad-text">easy to leave.</span></h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-mist">This is the operating contract for the invitation-only macOS beta. There is no public download yet; a tester receives a private signed package only after the release checks are complete.</p>
    </Reveal>
    <section className="mt-16 space-y-5">{steps.map(([title, body], index) => <Reveal key={title} delay={index * 60}><article className="glass grid gap-5 rounded-3xl p-7 md:grid-cols-[4rem_1fr]"><p className="font-mono text-sm text-teal">0{index + 1}</p><div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-3 leading-relaxed text-mist">{body}</p></div></article></Reveal>)}</section>
    <Reveal><section className="mt-16 grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-teal/35 bg-teal/5 p-7"><p className="font-mono text-xs uppercase tracking-widest text-teal">Your media</p><p className="mt-4 leading-relaxed text-mist">Source media, evidence frames, reports, notes, and feedback remain on your Mac by default. A feedback disposition is not permission to export footage.</p></article><article className="rounded-3xl border border-amber/35 bg-amber/5 p-7"><p className="font-mono text-xs uppercase tracking-widest text-amber">Support and removal</p><p className="mt-4 leading-relaxed text-mist">For support, share the app version, macOS version, and a description of the issue—never media unless separately agreed. To remove the beta, quit the app, move it from Applications to Trash, then delete its local review folder only if you want to remove your local reports and media.</p></article></section></Reveal>
    <Reveal><section className="mt-16 rounded-3xl border border-line p-8 text-center"><h2 className="text-2xl font-bold">Need help or want to join later?</h2><p className="mt-3 text-mist">The public beta is not open. The waitlist is the right path until an invitation arrives.</p><Link href="/lab/video-qa-workbench#waitlist" className="mt-6 inline-flex rounded-full bg-teal px-6 py-3 text-sm font-bold text-ink">Join the waitlist →</Link></section></Reveal>
  </div>;
}
