import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const { name, email, subject, message, honeypot, human } = body;

  // Silently succeed for honeypot hits — bots shouldn't know they were caught
  if (honeypot) return NextResponse.json({ ok: true });

  if (!human) {
    return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
  }
  if (!email || !message) {
    return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
  }

  const bodyText = [
    name && `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ]
    .filter((l): l is string => Boolean(l))
    .join("\n");

  const { error } = await resend.emails.send({
    from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
    to: "info@alexcoulombepresents.com",
    replyTo: email,
    subject: subject || `New inquiry from ${name || email}`,
    text: bodyText,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Couldn't send your message. Please email directly at info@alexcoulombepresents.com." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
