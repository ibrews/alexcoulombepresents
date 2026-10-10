import { customerFromSession } from "@/lib/commerce/tokens";
import { rateLimitAllows } from "@/lib/rate-limit";
import { getSecondBrainAccess } from "@/lib/secondBrain/access";
import { KIT_RELEASE_ID } from "@/lib/secondBrain/course";
import { FEEDBACK_CONSENT_VERSION } from "@/lib/secondBrain/feedback";
import { createFeedbackRouteHandlers } from "@/lib/secondBrain/feedbackRoutes";
import { createPostgresFeedbackStore } from "@/lib/secondBrain/feedbackStore";

export const runtime = "nodejs";

function sessionCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === "acp_session") return decodeURIComponent(value.join("="));
  }
  return undefined;
}

const store = createPostgresFeedbackStore({
  consentVersion: FEEDBACK_CONSENT_VERSION,
  releaseId: KIT_RELEASE_ID,
});

const handlers = createFeedbackRouteHandlers({
  store,
  getCustomerId: (request) => customerFromSession(sessionCookie(request)),
  getAccess: getSecondBrainAccess,
  consentVersion: FEEDBACK_CONSENT_VERSION,
  allowedOrigins: [process.env.NEXT_PUBLIC_SITE_URL ?? "https://alexcoulombepresents.com"],
  rateLimitAllows: (customerId) => rateLimitAllows(`second-brain-feedback:${customerId}`, 30, 60 * 60),
});

export const { GET, POST, DELETE } = handlers;
