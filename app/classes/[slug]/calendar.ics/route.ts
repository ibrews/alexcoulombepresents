import { classSessions, sessionBySlug } from "@/lib/classSessions";
import { sessionIcs } from "@/lib/sessionCalendar";

export function generateStaticParams() {
  return classSessions.map((s) => ({ slug: s.slug }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = sessionBySlug(slug);
  if (!s) return new Response("Not found", { status: 404 });
  return new Response(sessionIcs(s), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${s.slug}.ics"`,
    },
  });
}
