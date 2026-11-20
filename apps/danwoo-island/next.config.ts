import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SOUNDCLOUD_WIDGET = 'https://w.soundcloud.com';
const PHYSICS_AND_DECODER_WASM = "'wasm-unsafe-eval'";
const KTX2_DECODER_RUNTIME_EVAL = "'unsafe-eval'";
const DECODER_BLOB_WORKERS = 'blob:';

const SECURITY_HEADERS = createSecurityHeaders({
  sources: {
    'script-src': [PHYSICS_AND_DECODER_WASM, KTX2_DECODER_RUNTIME_EVAL, SOUNDCLOUD_WIDGET],
    'worker-src': [DECODER_BLOB_WORKERS],
    'connect-src': [DECODER_BLOB_WORKERS],
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
  agentRules: false,
  env: { NEXT_PUBLIC_WORLD_VERSION: worldVersion },
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }, ...worldAssetHeaders];
  },
};

export default nextConfig;
