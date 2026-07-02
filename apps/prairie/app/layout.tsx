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

// 디스플레이 폰트 — prairie 정체성(hub·gymlog와 폰트로 구별). 색은 코발트 공유.
const sora = Sora({
  variable: '--font-display',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '초원을 달리는 말 · Prairie',
  description: '말을 타고 초원을 자유롭게 달리는 three.js 인터랙티브 씬',
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
