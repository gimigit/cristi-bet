import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for stability
  turbo: false,
  // Disable output file tracing for simpler builds
  experimental: {
    outputFileTracing: false,
  },
  // Ensure static optimization
  compress: true,
  // Disable telemetry
  productionBrowserSourceMaps: false,
};

export default nextConfig;
