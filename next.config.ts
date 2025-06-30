import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
