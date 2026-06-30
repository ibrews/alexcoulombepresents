"use client";
import { useState } from "react";

type Step = { slide: 0 | 1; sub: number };

const STEPS: Step[] = [
  { slide: 0, sub: 0 },
  { slide: 0, sub: 1 },
  { slide: 0, sub: 2 },
  { slide: 1, sub: 0 },
  { slide: 1, sub: 1 },
];

export default function SensAIIntro() {
  const [step, setStep] = useState(0);
  const { slide, sub } = STEPS[step];

  return (
    <div className="select-none">
      <div className="min-h-[230px] relative" key={slide}>
        {slide === 0 ? <SlideWhoWhy sub={sub} /> : <SlideAgileLens sub={sub} />}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="font-mono text-xs text-mist transition-colors hover:text-snow disabled:opacity-20"
          aria-label="Previous step"
        >
          ← prev
        </button>

        <div className="flex gap-2 mx-auto">
          {[0, 1].map(i => (
            <button
              key={i}
              onClick={() => setStep(i === 0 ? 0 : 3)}
              aria-label={`Jump to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? "w-6 bg-teal" : "w-1.5 bg-line hover:bg-mist/40"
              }`}
            />
          ))}
        </div>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="font-mono text-xs text-teal transition-colors hover:text-snow"
            aria-label="Next step"
          >
            next →
          </button>
        ) : (
          <span className="font-mono text-xs text-mist/50">done ✓</span>
        )}
      </div>
    </div>
  );
}

function SlideWhoWhy({ sub }: { sub: number }) {
  return (
    <div className="sensai-slide-in">
      <p className="font-mono text-xs uppercase tracking-widest text-teal">
        WHO + WHY · SensAI 2026
      </p>
      <h3 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        Hi, I&apos;m Alex.
      </h3>

      <p
        className={`mt-5 max-w-2xl text-lg leading-relaxed text-mist transition-all duration-500 ${
          sub >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        Agile Lens founder · Unreal Authorized Instructor ·{" "}
        <span className="text-snow">
          building AI-first creative pipelines since early 2026
        </span>
      </p>

      <div
        className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 delay-100 ${
          sub >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {["Agile Lens", "OpenClaw", "Claude", "Local Fleet"].map(tag => (
          <span
            key={tag}
            className="rounded-full border border-teal/30 px-3 py-1 font-mono text-xs text-teal"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlideAgileLens({ sub }: { sub: number }) {
  return (
    <div className="sensai-slide-in">
      <p className="font-mono text-xs uppercase tracking-widest text-mist">
        Who built this and why
      </p>
      <h3 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        Agile Lens
      </h3>

      <p
        className={`mt-5 max-w-2xl leading-relaxed text-mist transition-all duration-500 ${
          sub >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        XR and immersive design out of NYC — ten years in, bootstrapped. We&apos;ve
        been called an &ldquo;XR strike team&rdquo; and &ldquo;Unreal technical wizards.&rdquo; We solve
        hard problems with emerging tech for clients from Google to Lincoln
        Center.{" "}
        <span className="text-snow">
          That&apos;s the lens everything in this talk comes from.
        </span>
      </p>
    </div>
  );
}
