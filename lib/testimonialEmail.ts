// Tiny, standalone Resend helper for the testimonials pipeline.
// Deliberately not in lib/commerce/email.ts — that file is owned elsewhere.

import { Resend } from "resend";

export async function sendTestimonialPendingEmail(input: {
  id: number;
  quote: string;
  name?: string | null;
  roleOrg?: string | null;
  classContext?: string | null;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { id, quote, name, roleOrg, classContext } = input;

  const approveUrl = `https://www.alexcoulombepresents.com/api/admin/testimonials?id=${id}&key=$ADMIN_KEY`;
  const rejectUrl = `https://www.alexcoulombepresents.com/api/admin/testimonials?id=${id}&key=$ADMIN_KEY&action=delete`;

  const text = [
    "New testimonial pending approval:",
    "",
    `"${quote}"`,
    "",
    name && `— ${name}${roleOrg ? `, ${roleOrg}` : ""}`,
    classContext && `Class: ${classContext}`,
    "",
    "Approve (paste in a terminal, with your real ADMIN_KEY substituted for $ADMIN_KEY):",
    `curl -X POST "${approveUrl}"`,
    "",
    "Delete instead:",
    `curl -X POST "${rejectUrl}"`,
  ]
    .filter((l): l is string => Boolean(l))
    .join("\n");

  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <info@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    subject: "Testimonial pending approval",
    text,
  });

  if (error) {
    console.error("[testimonialEmail] Resend error:", error);
  }
}
