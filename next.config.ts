/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** 
 * Rewrites proxy all client calls to /api/* -> BACKEND_URL/api/*
 * Works for dev & prod (Vercel) without exposing the backend origin to the browser.
 */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
