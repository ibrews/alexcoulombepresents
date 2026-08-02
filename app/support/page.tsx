import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import DonateBox from "@/components/DonateBox";

export const metadata: Metadata = {
  title: "Support the Lab",
  description:
    "If you like seeing Alex experiment, build, and share it all — open source, videos, talks — donations keep the lab running.",
  alternates: { canonical: "/support" },
};

export default async function Support({
  searchParams,
}: {
  searchParams: Promise<{ thanks?: string }>;
}) {
  const { thanks } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      {thanks && (
        <Reveal>
          <div className="mb-8 rounded-2xl border border-teal/40 bg-teal/10 p-5 text-snow">
            <strong>Thank you!</strong> Truly. If you left a comment or request, Alex reads every
            single one — expect the lab to get a little weirder on your behalf.
          </div>
        </Reveal>
      )}
      <Reveal>
        <p className="font-mono text-sm text-teal">/support</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Support <span className="grad-text">the Lab.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          If you like seeing me experiment and make stuff and share it — the open-source repos,
          the videos, the talks, the weird visionOS prototypes — donations are always welcome.
          They buy hardware, render time, and the freedom to keep giving most of this away.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-10">
          <DonateBox />
        </div>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-8 text-sm leading-relaxed text-mist">
          Prefer something less one-way? <a href="/store" className="text-teal underline underline-offset-2 hover:text-snow">Take a class or grab a voucher</a> — same effect, and you get
          something out of it too.
        </p>
      </Reveal>
    </div>
  );
}
