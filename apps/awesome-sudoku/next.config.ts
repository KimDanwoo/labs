import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SECURITY_HEADERS = createSecurityHeaders();

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzed(nextConfig);
