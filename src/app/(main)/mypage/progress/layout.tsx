import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '학습 현황',
  description: '카테고리별 진도, 연속 학습일, 히트맵으로 학습 현황을 확인하세요.',
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
