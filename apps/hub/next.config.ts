import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SECURITY_HEADERS = createSecurityHeaders();

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
