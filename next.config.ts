// next.config.ts
import type { NextConfig } from "next";

// ORIGIN: base URL backend
// - Di local: http://localhost:5000 (misal backend jalan di 5000)
// - Di Vercel: pakai NEXT_PUBLIC_API_URL = https://backend-magang.vercel.app
const ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://backend-magang.vercel.app"
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
