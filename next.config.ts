import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/lab/unrealitykit", destination: "/lab/unrealitykit-bridge", permanent: true },
      { source: "/urk", destination: "/lab/unrealitykit-bridge", permanent: true },
    ];
  },
};

export default nextConfig;
