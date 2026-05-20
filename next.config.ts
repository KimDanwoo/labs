import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.104.24'],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
