import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The gated-materials route reads content/materials/ at runtime with a
  // computed path, which Next's static trace can't follow — without this the
  // PDFs get dropped from the serverless bundle and a member's download 500s.
  outputFileTracingIncludes: {
    "/api/members/material": ["./content/materials/**"],
  },
  async redirects() {
    return [
      { source: "/lab/unrealitykit", destination: "/lab/unrealitykit-bridge", permanent: true },
      { source: "/urk", destination: "/lab/unrealitykit-bridge", permanent: true },
      // Drainspotting's launch video end card and pre-domain marketing copy
      // point here; the product's real home is its own domain now. Temporary
      // on purpose — if it ever gets a page on this site, a cached 301 in
      // someone's browser would be the thing standing in the way.
      { source: "/drainspotting", destination: "https://drainspotting.app", permanent: false },
      // The "view in browser" link in every already-delivered copy of this
      // issue (423 inboxes) points at the old slug — must keep resolving.
      {
        source: "/newsletter/2026-07-16-siggraph-and-august-cohort",
        destination: "/newsletter/2026-08-02-new-classes-and-the-lab",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
