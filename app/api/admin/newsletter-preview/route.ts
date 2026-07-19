import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getNewsletterIssue, getNewsletterIssues } from "@/lib/newsletters";
import { renderNewsletterEmail } from "@/lib/newsletterEmail";
import { LIST_REASON, isListSlug } from "@/lib/lists";
import { unsubscribeUrl } from "@/lib/unsubscribe";

function adminKeyValid(provided: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Renders the EXACT HTML an issue would send — same converter
// scripts/broadcast.mjs uses — so what you see here is what recipients get.
// Images in the .md draft (![alt](/newsletter/foo.jpg) or a full URL) show
// up exactly as they will in the email.
//
//   /api/admin/newsletter-preview?key=ADMIN_KEY&slug=2026-07-16-siggraph-and-august-cohort
//   /api/admin/newsletter-preview?key=ADMIN_KEY                → latest issue
//   ...&list=unreal&reason=you+signed+up+for+Unreal+classes    → preview a
//       different list's footer/reason line without sending anything
//   ...&email=you@example.com                                  → the
//       unsubscribe link in the footer becomes a REAL working link for that
//       address, so you can test the whole flow end to end
export async function GET(req: NextRequest) {
  if (!adminKeyValid(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const issue = slug ? getNewsletterIssue(slug) : getNewsletterIssues()[0];
  if (!issue) {
    return NextResponse.json({ error: "No newsletter issue found." }, { status: 404 });
  }

  const list = req.nextUrl.searchParams.get("list") ?? "newsletter";
  const reason =
    req.nextUrl.searchParams.get("reason") ??
    (isListSlug(list) ? LIST_REASON[list] : "you signed up on the site");
  const broad = req.nextUrl.searchParams.get("broad") !== "0"; // default on, matches the first consolidated send
  const previewEmail = req.nextUrl.searchParams.get("email") ?? "preview@example.com";

  const tailoringNote = broad
    ? " Future newsletters will be more tailored to the specific list you signed up for."
    : "";
  const unsubUrl = unsubscribeUrl(previewEmail);
  const footerHtml = `You&rsquo;re receiving this newsletter because ${reason}.${tailoringNote} <a href="${unsubUrl}" style="color:#888">To unsubscribe from this list, click here.</a>`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
  const html = renderNewsletterEmail({ bodyMarkdown: issue.body, footerHtml, siteUrl });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
