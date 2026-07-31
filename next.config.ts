// next.config.ts
import type { NextConfig } from "next";

// Hilangkan trailing slash agar tidak jadi //api
const ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

const nextConfig: NextConfig = {

  // Proxy semua request /api/* ke backend Railway
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
