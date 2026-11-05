import '@app/globals.css';
import { AppProviders } from '@app/providers/AppProviders';
import '@tokens/css/fonts.css';
import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Danwoo UI 카탈로그',
  description: '@ui/react 공통 컴포넌트 + @tokens/css 디자인 토큰 쇼케이스',
};

// 첫 페인트 전에 테마 클래스를 적용해 다크모드 깜빡임(FOUC)을 방지한다.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
