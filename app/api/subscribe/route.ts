import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { LISTS, isListSlug, RESEND_AUDIENCE_BY_LIST } from "@/lib/lists";
import { recordSignup } from "@/lib/db";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`subscribe:${clientIp(req)}`, 10, 60))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { email, name, message, honeypot, human } = body;
    // `list` is the new field; `track` kept for backward compatibility.
    const list = body.list ?? body.track;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught.
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (!isListSlug(list)) {
      return NextResponse.json({ error: "Invalid list." }, { status: 400 });
    }

    const label = LISTS[list];

    // Primary store: persist every signup to the Neon DB. Non-fatal — if the
    // DB is unreachable we still send the notification email below, so no
    // signup is ever lost and the form never breaks for the visitor.
    try {
      await recordSignup({ email, name, message, list });
    } catch (dbErr) {
      console.error("DB recordSignup failed (signup still emailed):", dbErr);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Mirror into a dedicated Resend audience when one exists (AI / Unreal),
    // so Alex can keep comparing those two in the Resend dashboard.
    const audienceId = RESEND_AUDIENCE_BY_LIST[list];
    if (audienceId) {
      try {
        await resend.contacts.create({
          audienceId,
          email,
          firstName: name || undefined,
          unsubscribed: false,
        });
      } catch (contactErr) {
        console.error("Resend contacts.create error (may be duplicate):", contactErr);
      }
    }

    // Notify Alex of the new signup.
    const { error: emailError } = await resend.emails.send({
      from: "Alex Coulombe Presents <noreply@alexcoulombepresents.com>",
      to: "info@alexcoulombepresents.com",
      replyTo: email,
      subject: `New signup: ${label}`,
      text: [
        name && `Name: ${name}`,
        `Email: ${email}`,
        `List: ${label} (${list})`,
        message && `\nMessage:\n${message}`,
      ]
        .filter((l): l is string => Boolean(l))
        .join("\n"),
    });

    if (emailError) {
      console.error("Resend email send error:", emailError);
      // Signup is persisted; don't surface the notification failure to the user.
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
