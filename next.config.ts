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
  // Disable caching for development and dynamic content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
