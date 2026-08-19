import '@app/globals.css';
import { AppProviders } from '@app/providers';
import type { Metadata } from 'next';
import { Gothic_A1, IBM_Plex_Mono } from 'next/font/google';

const display = Gothic_A1({
  variable: '--font-gothic-a1',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
});

const label = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'soundlab',
  description: 'DANWOO의 곡을 픽셀 파티클로 듣는 플레이어',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // 단일 다크 테마라 테마 토글 스크립트를 두지 않는다.
  return (
    <html lang="ko" className={`${display.variable} ${label.variable} h-full`}>
      <body className="h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
