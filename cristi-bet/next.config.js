/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
