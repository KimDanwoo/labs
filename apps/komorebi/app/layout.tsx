import '@app/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '코모레비 — 여름빛 산책',
  description: '논길을 지나 강과 바다로. 작은 꼬마와 함께 걷는 2.5D 여름 시골, Three.js 산책 프로젝트.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
