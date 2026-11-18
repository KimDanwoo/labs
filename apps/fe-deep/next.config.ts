import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const securityHeaders = createSecurityHeaders();

const nextConfig: NextConfig = {
  transpilePackages: ['@ui/react', '@tokens/css'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
