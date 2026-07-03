import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.0.104.24'],
  experimental: {
    viewTransition: false,
  },
  async headers() {
    // public 정적 미디어는 내용이 거의 안 바뀌므로 장기 immutable 캐시.
    // (Vercel은 public 파일을 기본적으로 매 요청 재검증하므로 명시 헤더가 없으면 느리다.)
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [
      { source: '/:path*.webp', headers: longCache },
      { source: '/:path*.mp4', headers: longCache },
    ];
  },
};

export default nextConfig;
