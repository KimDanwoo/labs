import { ViewTransition } from 'react';

import { Noto_Serif_KR } from 'next/font/google';

import type { Metadata } from 'next';

import { Providers } from './providers';
import './globals.css';

const notoSerifKr = Noto_Serif_KR({
  variable: '--font-noto-serif-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: '청연사주 — 당신의 운명을 읽어드립니다',
  description: '생년월일시를 입력하고 사주팔자를 확인해보세요.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSerifKr.variable} h-full`}>
      <body className="min-h-full flex flex-col relative">
        <Providers>
          <ViewTransition>{children}</ViewTransition>
        </Providers>
      </body>
    </html>
  );
}
