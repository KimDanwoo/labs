import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : undefined;

const securityHeaders = createSecurityHeaders({
  sources: {
    'connect-src': supabaseHost ? [`https://${supabaseHost}`, `wss://${supabaseHost}`] : [],
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
