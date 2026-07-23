import { getApprovedTestimonials } from "@/lib/db";
import Reveal from "@/components/Reveal";

export const revalidate = 300;

export default async function TestimonialWall() {
  let testimonials: Awaited<ReturnType<typeof getApprovedTestimonials>> = [];
  try {
    testimonials = await getApprovedTestimonials();
  } catch (err) {
    console.error("TestimonialWall: failed to load testimonials:", err);
  }

  if (testimonials.length === 0) return null;

  return (
    <div className="mt-20">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-widest text-teal">In their words</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">
          What <span className="grad-text">students say.</span>
        </h2>
      </Reveal>
      <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={Math.min(i * 50, 300)}>
            <figure className="glass break-inside-avoid rounded-2xl p-6">
              <blockquote className="text-sm leading-relaxed text-mist">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              {(t.name || t.role_org) && (
                <figcaption className="mt-4 font-mono text-xs text-teal">
                  — {t.name}
                  {t.name && t.role_org ? ", " : ""}
                  {t.role_org}
                </figcaption>
              )}
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
