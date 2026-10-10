import process from "node:process";

const proxyOrigin = process.env.SECOND_BRAIN_REHEARSAL_PROXY_ORIGIN;
const proxyToken = process.env.SECOND_BRAIN_REHEARSAL_PROXY_TOKEN;

if (!proxyOrigin || !proxyToken) {
  throw new Error("second-brain rehearsal preload requires its local proxy coordinates");
}

const originalFetch = globalThis.fetch.bind(globalThis);
const proxyUrl = new URL(proxyOrigin);
const allowedHosts = new Set(
  (process.env.SECOND_BRAIN_REHEARSAL_ALLOW_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function requestUrl(input) {
  if (typeof input === "string" || input instanceof URL) return new URL(input);
  if (input && typeof input.url === "string") return new URL(input.url);
  throw new TypeError("Unsupported fetch input in rehearsal");
}

function copyRequestInit(input, init) {
  if (typeof Request !== "undefined" && input instanceof Request) {
    return {
      method: input.method,
      headers: input.headers,
      body: input.body,
      redirect: input.redirect,
      signal: input.signal,
      ...init,
      duplex: init?.duplex ?? (input.body ? "half" : undefined),
    };
  }
  return init;
}

async function sendToProxy(pathname, input, init, originalUrl) {
  const requestInit = copyRequestInit(input, init) ?? {};
  const headers = new Headers(requestInit.headers);
  headers.set("x-rehearsal-proxy-token", proxyToken);
  headers.set("x-rehearsal-original-url", originalUrl.toString());
  return originalFetch(new URL(pathname, proxyOrigin), { ...requestInit, headers });
}

globalThis.fetch = async function rehearsalFetch(input, init) {
  const url = requestUrl(input);
  const host = url.hostname.toLowerCase();

  // Neon replaces the first hostname label with `api`, so the fixed
  // `rehearsal.invalid` database host becomes `api.invalid`.
  if ((host === "api.invalid" || host === "api.rehearsal.invalid") && url.pathname === "/sql") {
    return sendToProxy("/neon", input, init, url);
  }

  if (host === "api.resend.com") {
    return sendToProxy("/capture-email", input, init, url);
  }

  const loopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
  if (loopback || allowedHosts.has(host)) {
    return originalFetch(input, init);
  }

  throw new Error(`Second-brain rehearsal blocked outbound fetch to ${url.origin}`);
};

process.env.DATABASE_URL = "postgresql://rehearsal:rehearsal@rehearsal.invalid/rehearsal";
process.env.RESEND_API_KEY = "rehearsal_resend_key";
process.env.ZOOM_ACCOUNT_ID = "rehearsal-disabled";
process.env.ZOOM_CLIENT_ID = "rehearsal-disabled";
process.env.ZOOM_CLIENT_SECRET = "rehearsal-disabled";

Object.defineProperty(globalThis, "__SECOND_BRAIN_REHEARSAL__", {
  value: Object.freeze({ proxyOrigin: proxyUrl.origin }),
  enumerable: false,
  configurable: false,
  writable: false,
});
