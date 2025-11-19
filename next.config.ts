// next.config.ts
import type { NextConfig } from "next";

// Hilangkan trailing slash agar tidak jadi //api
const ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL ?? "mongodb+srv://Yohan:Kayu234@sistem.qbyhp.mongodb.net/sistem?retryWrites=true&w=majority").replace(/\/$/, "");

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
