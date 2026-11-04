import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '학습',
  description: '카테고리를 골라 질문에 답을 먼저 적어보고 모범 답변과 비교하며 학습하세요.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
