import { NextRequest, NextResponse } from "next/server";
import { deleteSignup } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { recordEmailEvent } from "@/lib/tracking";

// Self-serve unsubscribe by typed address — the /unsubscribe form posts here.
// No token, because the sends that need this path (a BCC batch out of Gmail,
// a forwarded issue) can't carry a per-recipient one. Someone typing an
// address they don't own can only ever REMOVE mail, never read or send it,
// so the worst case is a nuisance re-signup — an acceptable trade for
// honoring "stop emailing me" without making anyone hunt for a link.
export async function POST(req: NextRequest) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(`${site}/unsubscribe?err=1`, { status: 303 });
  }

  try {
    await deleteSignup(email);
  } catch (err) {
    console.error("[unsubscribe] self-serve delete failed", err);
    return NextResponse.redirect(`${site}/unsubscribed?ok=0`, { status: 303 });
  }

  return NextResponse.redirect(`${site}/unsubscribed?ok=1&email=${encodeURIComponent(email)}`, {
    status: 303,
  });
}

// One click from an email footer, no login. `list` omitted = removed from
// EVERY list (the safe default for "I don't want to hear from this sender
// again"); pass a specific list slug to only leave that one. `c` (optional)
// is the campaign slug the link was mailed in — logged so each send's report
// can show how many unsubscribes it caused.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const list = req.nextUrl.searchParams.get("list") ?? undefined;
  const campaign = req.nextUrl.searchParams.get("c");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  if (!email || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(`${site}/unsubscribed?ok=0`);
  }

  try {
    await deleteSignup(email, list);
  } catch (err) {
    console.error("[unsubscribe] delete failed", err);
    return NextResponse.redirect(`${site}/unsubscribed?ok=0`);
  }

  if (campaign) {
    // Best-effort attribution — the unsubscribe itself already succeeded.
    recordEmailEvent({ campaign, email, type: "unsub" }).catch(() => {});
  }

  return NextResponse.redirect(`${site}/unsubscribed?ok=1&email=${encodeURIComponent(email)}`);
}
