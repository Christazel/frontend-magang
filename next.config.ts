import type { NextConfig } from "next";

const ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
