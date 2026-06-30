import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { email, name, track, honeypot, human } = body;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (track !== "unreal" && track !== "ai") {
      return NextResponse.json({ error: "Invalid track." }, { status: 400 });
    }

    const audienceId =
      track === "ai"
        ? process.env.RESEND_AI_AUDIENCE_ID
        : process.env.RESEND_UNREAL_AUDIENCE_ID;

    // Add to audience — don't fail the whole request if they're already on the list
    try {
      await resend.contacts.create({
        audienceId: audienceId as string,
        email,
        firstName: name || undefined,
        unsubscribed: false,
      });
    } catch (contactErr) {
      console.error("Resend contacts.create error (may be duplicate):", contactErr);
    }

    // Notify Alex of the new signup
    const { error: emailError } = await resend.emails.send({
      from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
      to: "info@alexcoulombepresents.com",
      replyTo: email,
      subject: `New ${track === "ai" ? "AI" : "Unreal"} interest signup`,
      text: [name && `Name: ${name}`, `Email: ${email}`, `Track: ${track}`]
        .filter((l): l is string => Boolean(l))
        .join("\n"),
    });

    if (emailError) {
      console.error("Resend email send error:", emailError);
      // Contact was added; don't surface the notification failure to the user
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Subscribe route error:", err);
    return NextResponse.json(
      { error: "Couldn't sign you up. Please email info@alexcoulombepresents.com." },
      { status: 500 }
    );
  }
}
