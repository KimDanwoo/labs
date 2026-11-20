import '@app/globals.css';
import { AppProviders } from '@app/providers/AppProviders';
import '@repo/fonts/fonts.css';
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
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${label.variable} dark h-dvh`}>
      <body className="h-dvh">
        <link rel="preconnect" href="https://w.soundcloud.com" />
        <link rel="preconnect" href="https://i1.sndcdn.com" />
        <link rel="preconnect" href="https://wave.sndcdn.com" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
