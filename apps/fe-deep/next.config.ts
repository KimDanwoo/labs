import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

// e2e는 Supabase를 http 로컬 서버로 바꿔 띄우므로 프로토콜까지 환경변수를 따른다(실시간 구독은 같은 호스트의 ws/wss)
function supabaseOrigins(url: string | undefined): string[] {
  if (!url) return [];
  const origin = new URL(url);
  const socketProtocol = origin.protocol === 'https:' ? 'wss:' : 'ws:';
  return [origin.origin, `${socketProtocol}//${origin.host}`];
}

const securityHeaders = createSecurityHeaders({
  sources: {
    'connect-src': supabaseOrigins(process.env.NEXT_PUBLIC_SUPABASE_URL),
    // Google 로그인 프로필 사진
    'img-src': ['https://lh3.googleusercontent.com'],
  },
});

const nextConfig: NextConfig = {
  transpilePackages: ['@ui/react', '@tokens/css'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
