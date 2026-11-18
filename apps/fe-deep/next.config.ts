import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const securityHeaders = createSecurityHeaders();

const nextConfig: NextConfig = {
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
