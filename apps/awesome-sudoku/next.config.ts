import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SECURITY_HEADERS = createSecurityHeaders();
const GUESS_WORD_DATA_FILES = ['./data/guess-word/**/*'];

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: {
    '/api/guess-word': GUESS_WORD_DATA_FILES,
    '/api/guess-word/*': GUESS_WORD_DATA_FILES,
  },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};

const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzed(nextConfig);
