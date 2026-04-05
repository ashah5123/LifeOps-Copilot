import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Keep the dev-only Next.js indicator away from the left sidebar (default is bottom-left). */
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
