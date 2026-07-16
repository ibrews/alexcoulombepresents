import { NextRequest, NextResponse } from "next/server";
import { deleteSignup } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

// One click from an email footer, no login. `list` omitted = removed from
// EVERY list (the safe default for "I don't want to hear from this sender
// again"); pass a specific list slug to only leave that one.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const list = req.nextUrl.searchParams.get("list") ?? undefined;
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

  return NextResponse.redirect(`${site}/unsubscribed?ok=1&email=${encodeURIComponent(email)}`);
}
