import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

const TITLE = 'Danwoo Island';
const DESCRIPTION = '벚꽃과 강, 숲 사이를 자유롭게 달리는 작은 세계';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  appleWebApp: { title: TITLE },
  icons: {
    icon: [
      { url: '/world/favicons/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/world/favicons/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/world/favicons/favicon.ico',
    apple: { url: '/world/favicons/apple-touch-icon.png', sizes: '180x180' },
  },
  openGraph: { siteName: TITLE, type: 'website', title: TITLE, description: DESCRIPTION },
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
