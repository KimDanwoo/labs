import '@app/globals.css';
import { AppProviders } from '@app/providers/AppProviders';
import '@tokens/css/fonts.css';
import type { Metadata } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';

const label = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const SITE_URL = 'https://sound.danwoo.dev';
const SITE_NAME = 'soundlab';
const SITE_DESCRIPTION = 'DANWOO의 곡을 픽셀 파티클로 듣는 플레이어';

export const metadata: Metadata = {
  // 없으면 og:image가 상대경로로 나가 크롤러가 이미지를 못 읽는다.
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // images는 두지 않는다 — app/opengraph-image.png 파일 컨벤션이 채운다.
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  // twitter-image 파일은 두지 않는다. 트위터는 twitter:image가 없으면 og:image로 폴백한다.
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // 단일 다크 테마라 테마 토글 스크립트를 두지 않는다.
  // 높이는 dvh — 100%/100vh는 모바일에서 주소창까지 포함해 하단 재생바가 브라우저 UI 뒤로 잘린다.
  return (
    <html lang="ko" className={`${label.variable} h-dvh`}>
      <body className="h-dvh">
        {/* 첫 재생 전에 TLS를 미리 맺는다 — 재생 엔진(iframe·api.js)·아트워크·파형이 각각 다른 호스트다.
            React가 head로 올린다. 마운트 직후 세 곳을 동시에 두드리므로 핸드셰이크가 임계경로에 그대로 얹힌다. */}
        <link rel="preconnect" href="https://w.soundcloud.com" />
        <link rel="preconnect" href="https://i1.sndcdn.com" />
        <link rel="preconnect" href="https://wave.sndcdn.com" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
