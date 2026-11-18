import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

// 외부 리소스를 쓰면 sources에 출처를 더한다(@repo/security-headers)
const SECURITY_HEADERS = createSecurityHeaders();

const nextConfig: NextConfig = {
  transpilePackages: ['@tokens/css'],

  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
