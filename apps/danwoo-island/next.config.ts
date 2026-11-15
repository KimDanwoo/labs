import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { NextConfig } from 'next';

// 모든 앱 공통 보안 헤더. 앱별로 완화가 필요하면 그 앱에서만 덮어쓴다.
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const VERSIONED_ASSET_CACHE = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
const WORLD_ASSET_CACHE = [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }];

const WORLD_STAMP = path.join(process.cwd(), 'public/world/.stamp');
const WORLD_VERSION_LENGTH = 12;
const worldVersion = existsSync(WORLD_STAMP)
  ? readFileSync(WORLD_STAMP, 'utf8').trim().slice(0, WORLD_VERSION_LENGTH)
  : '';

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_WORLD_VERSION: worldVersion },
  async headers() {
    return [
      { source: '/(.*)', headers: SECURITY_HEADERS },
      { source: '/world/:path*', headers: WORLD_ASSET_CACHE },
      { source: '/world/:path*', has: [{ type: 'query', key: 'v' }], headers: VERSIONED_ASSET_CACHE },
    ];
  },
};

export default nextConfig;
