import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오늘의 챌린지',
  description: '매일 5문제씩 풀며 프론트엔드 실력을 꾸준히 쌓으세요.',
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
