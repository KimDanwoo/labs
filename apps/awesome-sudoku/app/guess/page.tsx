import { GuessWordPage } from '@views/guess-word';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '맞춰봐',
  description: '오늘의 단어를 맞히는 게임. 명사를 입력하면 정답과 뜻이 얼마나 가까운지 유사도로 알려줘요.',
  alternates: { canonical: '/guess' },
};

export default function Guess() {
  return <GuessWordPage />;
}
