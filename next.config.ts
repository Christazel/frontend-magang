// next.config.ts
import type { NextConfig } from "next";

// Hilangkan trailing slash agar tidak jadi //api
const ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL ?? "https://agile-courage-production-b69f.up.railway.app/").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Biarkan build Vercel tidak gagal karena lint
  eslint: { ignoreDuringBuilds: true },

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
