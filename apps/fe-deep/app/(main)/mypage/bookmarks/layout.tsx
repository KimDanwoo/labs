import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '북마크',
  description: '북마크한 프론트엔드 면접 질문을 모아보세요.',
};

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
