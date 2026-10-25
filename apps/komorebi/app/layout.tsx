import '@app/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://komorebi.danwoo.dev'),
  title: '코모레비',
  applicationName: '코모레비',
  twitter: { card: 'summary_large_image' },
  openGraph: {
    title: '코모레비',
    siteName: '코모레비',
    description: '여름 시골을 느긋하게 걷는 게임',
    locale: 'ko_KR',
    type: 'website',
  },
  description: '여름 시골을 느긋하게 걷는 게임',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
