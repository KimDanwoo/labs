import '@app/globals.css';
import { AppHeader } from '@app/layout/AppHeader';
import { AppProviders } from '@app/providers/AppProviders';
import { SITE_DESCRIPTION, SITE_HEADLINE, SITE_NAME, SITE_TITLE, SITE_URL } from '@entities/game-catalog';
import '@repo/fonts/fonts.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1e' },
  ],
};

const HOME_IMAGE = { url: '/opengraph-image.png', width: 1200, height: 630, alt: SITE_HEADLINE };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_HEADLINE,
    description: SITE_DESCRIPTION,
    url: '/',
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    images: [HOME_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: SITE_HEADLINE, description: SITE_DESCRIPTION, images: [HOME_IMAGE] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased bg-surface-secondary">
        <AppProviders>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
