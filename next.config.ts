const ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "https://backend-magang.vercel.app/"
).replace(/\/$/, "");

export default {
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
