import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Keep the dev-only Next.js indicator away from the left sidebar (default is bottom-left). */
  devIndicators: {
    position: "bottom-right",
  },
  /** Enable standalone output for Docker deployment */
  output: "standalone",
};

export default nextConfig;
