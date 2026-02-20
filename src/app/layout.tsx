import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/shared/ui/providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fedeep.kr';

export const metadata: Metadata = {
  title: {
    default: '프딥 - 프론트엔드, 딥하게 알자',
    template: '%s | 프딥',
  },
  description:
    '프론트엔드를 딥하게 학습하는 플랫폼. 레퍼런스와 플래시카드로 핵심 개념을 익히세요.',
  keywords: ['프론트엔드', 'React', 'JavaScript', 'TypeScript', '프딥', '면접'],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '프딥',
    title: '프딥 - 프론트엔드, 딥하게 알자',
    description:
      '프론트엔드를 딥하게 학습하는 플랫폼. 레퍼런스와 플래시카드로 핵심 개념을 익히세요.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: '프딥 - 프론트엔드, 딥하게 알자',
    description:
      '프론트엔드를 딥하게 학습하는 플랫폼. 레퍼런스와 플래시카드로 핵심 개념을 익히세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '프딥',
              url: siteUrl,
              description:
                '프론트엔드를 딥하게 학습하는 플랫폼. 레퍼런스와 플래시카드로 핵심 개념을 익히세요.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${siteUrl}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
