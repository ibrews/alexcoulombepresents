import { NextRequest, NextResponse } from "next/server";
import { ensureCommerceSchema, sql } from "@/lib/commerce/schema";
import { issueMagicLink } from "@/lib/commerce/tokens";
import { sendMagicLinkEmail } from "@/lib/commerce/email";

// Requests a fresh magic link for an existing customer. Always responds
// with the same generic message regardless of whether the email exists —
// avoids leaking which addresses have purchased.
export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await ensureCommerceSchema();
  const rows = (await sql()`SELECT id FROM customers WHERE brand = 'acp' AND email = ${email}`) as { id: number }[];
  const customerId = rows[0]?.id;

  if (customerId) {
    const token = await issueMagicLink(customerId);
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com";
    const magicLinkUrl = `${site}/api/account/verify?token=${token}`;
    await sendMagicLinkEmail({ email, magicLinkUrl });
  }

  return NextResponse.json({ ok: true, message: "If that email has an account, a sign-in link is on its way." });
}
