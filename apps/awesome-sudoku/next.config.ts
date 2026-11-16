import withBundleAnalyzer from '@next/bundle-analyzer';
import { createSecurityHeaders } from '@repo/security-headers';
import type { NextConfig } from 'next';

const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

// Firebase 인증(Google 팝업 로그인)과 Firestore — https://firebase.google.com/docs/auth/web/redirect-best-practices
const SECURITY_HEADERS = createSecurityHeaders({
  sources: {
    'script-src': ['https://apis.google.com'],
    'connect-src': [
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firestore.googleapis.com',
    ],
    'frame-src': firebaseAuthDomain ? [`https://${firebaseAuthDomain}`] : [],
    'img-src': ['https://lh3.googleusercontent.com'],
  },
});

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

const analyzed = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzed(nextConfig);
