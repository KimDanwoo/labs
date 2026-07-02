import '@app/globals.css';
import { AppProviders } from '@app/providers';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** 프로젝트 허브 전용 디스플레이 폰트 — Geist, Space Grotesk와 뚜렷하게 다른 결 */
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

// TODO: 실제 배포 도메인으로 교체 (OG 이미지 절대경로 생성에 쓰임)
const SITE_URL = 'https://danwoo-lab.vercel.app';
const SITE_NAME = 'Danwoo Lab';
const SITE_DESCRIPTION = 'AI로 아이디어를 현실로 만드는 프론트엔드 개발자의 실험실';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

// 첫 페인트 전에 테마 클래스를 적용해 다크모드 깜빡임(FOUC)을 방지한다.
const themeInitScript =
  "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} h-full antialiased`}
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
