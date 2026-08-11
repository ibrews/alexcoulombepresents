import type { Repo } from "@/lib/data";
import Reveal from "@/components/Reveal";

// Real reactions, always linked back to the source post -- a testimonial on
// this page is one click from verifiable, never a bare unattributed quote.
export default function Testimonials({ testimonials }: { testimonials: NonNullable<Repo["testimonials"]> }) {
  if (testimonials.length === 0) return null;

  return (
    <Reveal>
      <div className="mt-12">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">What people are saying</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {testimonials.map((t) => (
            <a
              key={t.url}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass flex flex-col gap-3 rounded-2xl p-5 transition-colors hover:border-teal/40"
            >
              <p className="leading-relaxed text-snow">&ldquo;{t.quote}&rdquo;</p>
              {t.image && (
                // eslint-disable-next-line @next/next/no-img-element -- a
                // small, low-res user screenshot; next/image's optimization
                // pipeline isn't worth it here.
                <img
                  src={t.image}
                  alt={`Screenshot shared by @${t.handle}`}
                  className="w-full max-w-[240px] rounded-lg border border-line"
                />
              )}
              <p className="font-mono text-xs text-mist">
                @{t.handle} · {t.date}
              </p>
            </a>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
