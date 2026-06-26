import '@app/globals.css';
import { AppProviders } from '@app/providers';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// gymlog 전용 디스플레이 폰트 — 헤딩·큰 숫자에. hub와 구별되는 정체성.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: 'gymlog', template: '%s · gymlog' },
  description: '헬스장에서 폰 하나로 루틴을 따라가고 기록하는 운동 동행 앱',
  applicationName: 'gymlog',
  // iOS 홈 화면 추가 시 standalone 앱처럼 동작(상태바 투명 → safe-area로 보정).
  appleWebApp: {
    capable: true,
    title: 'gymlog',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 운동 중 오조작 방지: 사용자 확대는 허용하되 자동 확대는 막는다.
  maximumScale: 5,
  // 노치 영역까지 화면을 채우고, env(safe-area-inset-*)로 콘텐츠를 보정한다.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
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
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
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
