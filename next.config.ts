import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rental-app-26-971966100280-us-east-1-an.s3.us-east-1.amazonaws.com',
        pathname: '/uploads/images/**',
      },
    ],
  },
};

export default nextConfig;