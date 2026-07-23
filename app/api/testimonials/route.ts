import { NextRequest, NextResponse } from "next/server";
import { createTestimonial } from "@/lib/db";
import { sendTestimonialPendingEmail } from "@/lib/testimonialEmail";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`testimonials:${clientIp(req)}`, 5, 60))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { quote, name, roleOrg, email, classContext, honeypot, human } = body;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught.
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    if (!quote || typeof quote !== "string" || !quote.trim()) {
      return NextResponse.json({ error: "A quote is required." }, { status: 400 });
    }
    if (quote.length > 2000) {
      return NextResponse.json({ error: "That's a bit long — please keep it under 2000 characters." }, { status: 400 });
    }

    const testimonial = await createTestimonial({
      quote: quote.trim(),
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      roleOrg: typeof roleOrg === "string" && roleOrg.trim() ? roleOrg.trim() : null,
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      classContext: typeof classContext === "string" && classContext.trim() ? classContext.trim() : null,
    });

    try {
      await sendTestimonialPendingEmail({
        id: testimonial.id,
        quote: testimonial.quote,
        name: testimonial.name,
        roleOrg: testimonial.role_org,
        classContext: testimonial.class_context,
      });
    } catch (emailErr) {
      console.error("Testimonial notification email failed (testimonial still saved):", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Testimonials route error:", err);
    return NextResponse.json(
      { error: "Couldn't submit your testimonial. Please email info@alexcoulombepresents.com." },
      { status: 500 }
    );
  }
}
