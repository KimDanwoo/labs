import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const SOUNDCLOUD_WIDGET = 'https://w.soundcloud.com';

const SECURITY_HEADERS = createSecurityHeaders({
  sources: {
    'script-src': [SOUNDCLOUD_WIDGET],
    'frame-src': [SOUNDCLOUD_WIDGET],
    'img-src': ['https://i1.sndcdn.com'],
    'connect-src': ['https://wave.sndcdn.com'],
  },
});

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },

  transpilePackages: ['@tokens/css'],
};

export default nextConfig;
