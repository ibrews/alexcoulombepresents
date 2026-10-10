import {
  FEEDBACK_CONSENT_VERSION,
  FeedbackValidationError,
  parseFeedbackPostAction,
} from "./feedback.ts";
import { FeedbackStoreError, type FeedbackStore } from "./feedbackStore.ts";

const MAX_POST_BYTES = 8 * 1024;

export type FeedbackRouteDependencies = {
  store: FeedbackStore;
  getCustomerId(request: Request): Promise<number | null>;
  getAccess(customerId: number): Promise<{ allowed: boolean; member: boolean }>;
  consentVersion?: string;
  allowedOrigins?: readonly string[];
  rateLimitAllows?(customerId: number): Promise<boolean>;
};

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

function requestIsSameOrigin(request: Request, configuredOrigins: readonly string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const normalized = new URL(origin).origin;
    return normalized === new URL(request.url).origin || configuredOrigins.some((item) => normalized === new URL(item).origin);
  } catch {
    return false;
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_POST_BYTES) {
    throw new FeedbackValidationError("Feedback request is too large.");
  }
  if (!request.body) throw new FeedbackValidationError("Missing JSON body.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_POST_BYTES) {
      await reader.cancel();
      throw new FeedbackValidationError("Feedback request is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new FeedbackValidationError("Invalid JSON body.");
  }
}

export function createFeedbackRouteHandlers(dependencies: FeedbackRouteDependencies) {
  const consentVersion = dependencies.consentVersion ?? FEEDBACK_CONSENT_VERSION;
  const configuredOrigins = dependencies.allowedOrigins ?? [];

  async function authenticated(request: Request): Promise<number | Response> {
    try {
      const customerId = await dependencies.getCustomerId(request);
      return customerId ?? error("Sign in required.", 401);
    } catch {
      return error("Feedback is temporarily unavailable.", 503);
    }
  }

  async function eligible(customerId: number): Promise<boolean | Response> {
    try {
      const access = await dependencies.getAccess(customerId);
      return access.allowed ? true : error("Current course access required.", 403);
    } catch {
      return error("Feedback is temporarily unavailable.", 503);
    }
  }

  async function GET(request: Request): Promise<Response> {
    const auth = await authenticated(request);
    if (auth instanceof Response) return auth;
    try {
      return json(await dependencies.store.get(auth));
    } catch {
      return error("Feedback is temporarily unavailable.", 503);
    }
  }

  async function POST(request: Request): Promise<Response> {
    if (!requestIsSameOrigin(request, configuredOrigins)) return error("Same-origin request required.", 403);
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return error("Content-Type must be application/json.", 415);

    const auth = await authenticated(request);
    if (auth instanceof Response) return auth;

    try {
      const action = parseFeedbackPostAction(await readBoundedJson(request));
      if (action.consentVersion !== consentVersion) {
        return error("Consent notice has changed. Review the current choice.", 409);
      }

      // Declining/turning off sharing stays unblocked as a privacy control.
      // DELETE is likewise never rate limited.
      if ((action.action === "submit" || action.enabled) && dependencies.rateLimitAllows) {
        let allowed = true;
        try {
          allowed = await dependencies.rateLimitAllows(auth);
        } catch {
          // Collection throttling is a best-effort abuse control. A limiter
          // outage must not turn into a new dependency for member access.
        }
        if (!allowed) return error("Too many feedback requests. Please try again later.", 429);
      }

      if (action.action === "consent") {
        if (action.enabled) {
          const access = await eligible(auth);
          if (access instanceof Response) return access;
        }
        return json(await dependencies.store.setConsent(auth, action.enabled, action.consentVersion));
      }

      const access = await eligible(auth);
      if (access instanceof Response) return access;
      const result = await dependencies.store.submit(auth, action.consentVersion, action.payload);
      return json(result, result.duplicate ? 200 : 201);
    } catch (caught) {
      if (caught instanceof FeedbackValidationError) return error(caught.message, 400);
      if (caught instanceof FeedbackStoreError) {
        if (caught.code === "consent_required") return error("Current feedback consent required.", 409);
        if (caught.code === "consent_version_mismatch") {
          return error("Consent notice has changed. Review the current choice.", 409);
        }
        return error("Submission ID was already used for different feedback.", 409);
      }
      return error("Feedback is temporarily unavailable.", 503);
    }
  }

  async function DELETE(request: Request): Promise<Response> {
    if (!requestIsSameOrigin(request, configuredOrigins)) return error("Same-origin request required.", 403);
    const auth = await authenticated(request);
    if (auth instanceof Response) return auth;
    try {
      return json(await dependencies.store.withdraw(auth));
    } catch {
      return error("Feedback is temporarily unavailable.", 503);
    }
  }

  return { GET, POST, DELETE };
}
