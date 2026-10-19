import '@app/globals.css';
import { AppProviders } from '@app/providers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Sora } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Unicorn Rush 디스플레이 폰트.
const sora = Sora({
  variable: '--font-display',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '유니콘 러시 · Unicorn Rush',
  applicationName: 'Unicorn Rush',
  description: '유니콘을 타고 초원과 하늘을 탐험하는 3D 비행 플레이그라운드. 공중 회전과 제로백 스킬을 즐겨보세요.',
  openGraph: {
    title: '유니콘 러시 · Unicorn Rush',
    siteName: 'Unicorn Rush',
    description: '유니콘과 함께하는 3D 비행. 공중 회전, 별가루, 제로백 가속.',
    locale: 'ko_KR',
    type: 'website',
  },
};

// 첫 페인트 전에 테마 클래스를 적용해 다크모드 깜빡임(FOUC)을 방지한다.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
