import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SECURITY_HEADERS = createSecurityHeaders({ sources: { 'script-src': ["'wasm-unsafe-eval'"] } });

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },

  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
