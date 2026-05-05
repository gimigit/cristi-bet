/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Force Webpack build (Vercel default is Turbopack which is unstable)
  experimental: {
    turbo: false,
  },
};

module.exports = nextConfig;
