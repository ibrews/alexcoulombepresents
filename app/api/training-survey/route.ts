import { NextRequest, NextResponse } from "next/server";
import { recordTrainingSurveyResponse, getTrainingSurveyCounts } from "@/lib/db";
import {
  isEngagementOption,
  isTopicOption,
  isAiStanceOption,
  isSkillLevelOption,
} from "@/lib/trainingSurvey";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`training-survey:${clientIp(req)}`, 10, 60))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });

    const { email, engagement, topics, aiStance, skillLevel, honeypot, human } = body;

    // Silently succeed for honeypot hits — bots shouldn't know they were caught.
    if (honeypot) return NextResponse.json({ ok: true });

    if (!human) {
      return NextResponse.json({ error: "Please confirm you're not a robot." }, { status: 400 });
    }
    if (!Array.isArray(engagement) || engagement.length === 0 || !engagement.every(isEngagementOption)) {
      return NextResponse.json({ error: "Answer question 1: how you'd like to engage." }, { status: 400 });
    }
    if (!Array.isArray(topics) || topics.length === 0 || !topics.every(isTopicOption)) {
      return NextResponse.json({ error: "Answer question 2: pick at least one topic." }, { status: 400 });
    }
    if (!isAiStanceOption(aiStance)) {
      return NextResponse.json({ error: "Answer question 3: your take on learning AI." }, { status: 400 });
    }
    if (!isSkillLevelOption(skillLevel)) {
      return NextResponse.json({ error: "Answer question 4: your Unreal skill level." }, { status: 400 });
    }
    if (email !== undefined && email !== null && email !== "" && typeof email !== "string") {
      return NextResponse.json({ error: "Bad request." }, { status: 400 });
    }

    await recordTrainingSurveyResponse({
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      engagement,
      topics,
      aiStance,
      skillLevel,
    });

    const counts = await getTrainingSurveyCounts();
    return NextResponse.json({ ok: true, ...counts });
  } catch (err) {
    console.error("Training survey route error:", err);
    return NextResponse.json(
      { error: "Couldn't record your answers. Please email info@alexcoulombepresents.com." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const counts = await getTrainingSurveyCounts();
    return NextResponse.json({ ok: true, ...counts });
  } catch (err) {
    console.error("Training survey GET error:", err);
    return NextResponse.json({ error: "Couldn't load results." }, { status: 500 });
  }
}
