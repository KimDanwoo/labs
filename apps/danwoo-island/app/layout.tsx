import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = 'https://world.danwoo.dev';
const SITE_NAME = 'Danwoo Island';
const TITLE = 'Danwoo Island — 3D 포트폴리오';
const DESCRIPTION = 'AI Agent와 three.js로 구현한 해변 탐험';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
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
