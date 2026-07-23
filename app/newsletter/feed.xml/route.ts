import { getNewsletterIssues } from "@/lib/newsletters";
import { markdownToEmailHtml } from "@/lib/newsletterEmail";

// RSS feed of the newsletter archive — lets readers follow without giving an
// email address, and makes issues easy to cross-post/syndicate.
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const issues = getNewsletterIssues().filter((i) => i.title);

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const items = issues
    .map((i) => {
      const url = `${site}/newsletter/${i.slug}`;
      const html = markdownToEmailHtml(i.body, site);
      return `    <item>
      <title>${esc(i.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description><![CDATA[${html}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Alex Coulombe Presents — Newsletter</title>
    <link>${site}/newsletter</link>
    <description>New classes before they hit the store, Lab launches, membership news, and whatever Alex learned the hard way that month.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
