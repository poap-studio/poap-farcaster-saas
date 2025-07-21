import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ethereumupgrades.com',
        pathname: '/assets/img/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.poap.xyz',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
