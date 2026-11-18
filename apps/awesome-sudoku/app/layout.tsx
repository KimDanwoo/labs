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
    '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임. ' +
    '4단계 난이도, 메모 기능, 포인트 시스템으로 두뇌를 깨우세요.',
  openGraph: {
    title: '어썸 스도쿠 — 온라인 퍼즐 게임',
    description: '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '어썸 스도쿠',
  },
  twitter: {
    card: 'summary',
    title: '어썸 스도쿠 — 온라인 퍼즐 게임',
    description: '클래식 및 킬러 모드를 지원하는 온라인 스도쿠 퍼즐 게임.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{' +
              "var t=JSON.parse(localStorage.getItem('sudoku-theme')||'\"system\"');" +
              "var d=t==='dark'||(t==='system'&&window.matchMedia(" +
              "'(prefers-color-scheme: dark)').matches);" +
              "if(d)document.documentElement.classList.add('dark')" +
              '}catch(e){}})();',
          }}
        />
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
