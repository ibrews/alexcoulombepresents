import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import { getNewsletterIssue, getNewsletterIssues } from "@/lib/newsletters";

export function generateStaticParams() {
  return getNewsletterIssues().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const issue = getNewsletterIssue((await params).slug);
  return {
    title: issue ? `${issue.title} · Newsletter` : "Newsletter",
    description: issue?.subject,
    alternates: { canonical: issue ? `/newsletter/${issue.slug}` : "/newsletter" },
  };
}

export default async function NewsletterIssue({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const issue = getNewsletterIssue((await params).slug);
  if (!issue) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <Link href="/newsletter" className="font-mono text-sm text-teal hover:text-snow">
          ← /newsletter
        </Link>
        <p className="mt-6 font-mono text-xs text-mist">{issue.date}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{issue.title}</h1>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-10">
          <SimpleMarkdown markdown={issue.body} />
        </div>
      </Reveal>
    </div>
  );
}
