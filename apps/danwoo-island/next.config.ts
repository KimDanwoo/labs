import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SOUNDCLOUD_WIDGET = 'https://w.soundcloud.com';

const SECURITY_HEADERS = createSecurityHeaders({
  sources: {
    // 물리 엔진(Rapier)·Draco/KTX2 디코더가 WebAssembly와 blob 워커를 쓴다.
    // 'unsafe-eval'은 KTX2 Basis 디코더가 워커 안에서 Function()으로 코드를 만들기 때문이다 — 빼면 월드가 로딩에서 멈춘다.
    // 로그인·사용자 데이터가 없는 앱이라 이 앱에만 허용한다
    'script-src': ["'wasm-unsafe-eval'", "'unsafe-eval'", SOUNDCLOUD_WIDGET],
    'worker-src': ['blob:'],
    'connect-src': ['blob:'],
    'frame-src': [SOUNDCLOUD_WIDGET],
    'img-src': ['https://i1.sndcdn.com', 'https://danwoo.dev'],
  },
});

const VERSIONED_ASSET_CACHE = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
const WORLD_ASSET_CACHE = [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }];
const DEVELOPMENT_ASSET_CACHE = [{ key: 'Cache-Control', value: 'no-cache' }];
const isDevelopment = process.env.NODE_ENV === 'development';

const WORLD_STAMP = path.join(process.cwd(), 'public/world/.stamp');
const WORLD_VERSION_LENGTH = 12;
const worldVersion = existsSync(WORLD_STAMP)
  ? readFileSync(WORLD_STAMP, 'utf8').trim().slice(0, WORLD_VERSION_LENGTH)
  : '';

const WORLD_ASSETS = '/world/:path*';
const worldAssetHeaders = isDevelopment
  ? [{ source: WORLD_ASSETS, headers: DEVELOPMENT_ASSET_CACHE }]
  : [
      { source: WORLD_ASSETS, headers: WORLD_ASSET_CACHE },
      {
        source: WORLD_ASSETS,
        has: [{ type: 'query' as const, key: 'v', value: worldVersion || undefined }],
        headers: VERSIONED_ASSET_CACHE,
      },
    ];

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_WORLD_VERSION: worldVersion },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }, ...worldAssetHeaders];
  },
};

export default nextConfig;
