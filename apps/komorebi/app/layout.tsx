import '@app/globals.css';
import '@repo/fonts/fonts.css';
import type { Metadata } from 'next';

const SITE_URL = 'https://komorebi.danwoo.dev';
const TITLE = '코모레비 — 여름빛 산책';
const DESCRIPTION = '논길을 지나 강과 바다로. 작은 꼬마와 함께 걷는 2.5D 여름 시골, Three.js 산책 프로젝트.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', locale: 'ko_KR', url: '/' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
