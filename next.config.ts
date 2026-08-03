import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/lab/unrealitykit", destination: "/lab/unrealitykit-bridge", permanent: true },
      { source: "/urk", destination: "/lab/unrealitykit-bridge", permanent: true },
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
