import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Keep the dev-only Next.js indicator away from the left sidebar (default is bottom-left). */
  devIndicators: {
    position: "bottom-right",
  },

  /** Proxy /api requests to the FastAPI backend during development. */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
