import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The gated-materials route (/api/materials) reads content/materials/ at
  // runtime with a computed path, which Next's static trace can't follow —
  // without this the files get dropped from the serverless bundle and a
  // paying customer's download 500s.
  outputFileTracingIncludes: {
    "/api/materials": ["./content/materials/**"],
  },
  async redirects() {
    return [
      { source: "/lab/unrealitykit", destination: "/lab/unrealitykit-bridge", permanent: true },
      { source: "/urk", destination: "/lab/unrealitykit-bridge", permanent: true },
      // Renamed 2026-09-05 to reflect the OpenXR foundation, not just Vision
      // Pro — the old slug is already live in submitted Epic MegaGrant
      // applications, so it must keep resolving indefinitely.
      { source: "/lab/unreal-visionos", destination: "/lab/avp-openxr", permanent: true },
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
