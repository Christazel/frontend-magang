// next.config.ts
import type { NextConfig } from "next";

const ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://backend-magang.vercel.app/"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Biarkan build Vercel tidak gagal karena lint
  eslint: { ignoreDuringBuilds: true },

  // Proxy semua request /api/* ke backend (Vercel / lokal)
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
