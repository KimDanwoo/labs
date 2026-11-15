import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const SITE_NAME = 'Danwoo Island';
const TITLE = 'Danwoo Island — 3D 포트폴리오';
const DESCRIPTION = '차를 몰고 열대 섬을 돌아다니며 프로젝트, 블로그 글, 음악을 볼 수 있는 3D 포트폴리오예요.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: { title: SITE_NAME },
  icons: {
    icon: [
      { url: '/world/favicons/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/world/favicons/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/world/favicons/favicon.ico',
    apple: { url: '/world/favicons/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: { siteName: SITE_NAME, type: 'website', title: TITLE, description: DESCRIPTION },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
