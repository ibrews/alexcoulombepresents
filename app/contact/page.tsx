import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Alex Coulombe — training inquiries, collaborations, custom projects, or just to say hello.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <Ethereal variant="ghost" />

      <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        {/* Left col — photo + context */}
        <Reveal>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sxsw-2026.jpg"
              alt="Alex Coulombe at SXSW 2026"
              className="w-full rounded-3xl object-cover"
              style={{ aspectRatio: "4 / 5", objectPosition: "center top" }}
            />
            <div className="mt-8 space-y-5 text-sm leading-relaxed text-mist">
              <p>
                <span className="text-snow">Training and workshops.</span> One session or a full
                curriculum — live, on Zoom or on-site, using your own project. Booking for a
                company or studio?{" "}
                <a href="/training#teams" className="text-teal hover:underline">
                  Team training has its own fast lane
                </a>
                .
              </p>
              <p>
                <span className="text-snow">Collaboration and consulting.</span> Engine-level
                fixes, spatial computing pipelines, AI agent systems — delivered through{" "}
                <a
                  href="https://agilelens.com/portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:underline"
                >
                  Agile Lens
                </a>{" "}
                (browse a decade of client work there). Especially interested in weird problems at
                the edge of what the documentation covers.
              </p>
              <p>
                <span className="text-snow">Speaking and events.</span> SIGGRAPH, HarvardXR,
                Venice Biennale, Unreal Fest and beyond — reach out early, spots fill.
              </p>
              <p className="pt-2">
                <a
                  href="mailto:info@alexcoulombepresents.com"
                  className="font-mono text-xs text-teal hover:underline"
                >
                  info@alexcoulombepresents.com
                </a>
              </p>
              <p>
                <a href="/links" className="text-teal hover:underline">
                  Every other link
                </a>{" "}
                — Agile Lens, socials, the podcast — lives on one page.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Right col — form */}
        <div>
          <Reveal>
            <p className="font-mono text-sm text-teal">/contact</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Say hello. <span className="grad-text">Let&apos;s make something.</span>
            </h1>
            <p className="mt-4 text-mist">
              Fill out the form below and Alex will get back to you — or reach out directly by
              email if you prefer.
            </p>
          </Reveal>
          <Reveal>
            <div className="mt-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
