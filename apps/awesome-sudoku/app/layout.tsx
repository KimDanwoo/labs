import '@app/globals.css';
import { AppProviders } from '@app/providers/AppProviders';
import '@repo/fonts/fonts.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
};

const BASE_URL = 'https://sudoku.danwoo.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: '/' },
  title: {
    default: '어썸 스도쿠 — 온라인 퍼즐 게임',
    template: '%s | 어썸 스도쿠',
  },
  description:
    '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임. ' + '4단계 난이도와 메모 기능으로 두뇌를 깨우세요.',
  openGraph: {
    title: '어썸 스도쿠 — 온라인 퍼즐 게임',
    description: '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '어썸 스도쿠',
  },
  twitter: {
    card: 'summary_large_image',
    title: '어썸 스도쿠 — 온라인 퍼즐 게임',
    description: '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
