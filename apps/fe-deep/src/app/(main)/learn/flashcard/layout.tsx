import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '플래시카드',
  description: 'SM-2 간격 반복 알고리즘으로 프론트엔드 핵심 개념을 장기 기억에 남기세요.',
};

export default function FlashcardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
