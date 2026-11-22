import { GomokuPage } from '@views/gomoku';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오목',
  description: '컴퓨터 고수와 두는 오목. 가로·세로·대각선으로 다섯 알을 먼저 이으면 이겨요.',
  alternates: { canonical: '/gomoku' },
};

export default function Gomoku() {
  return <GomokuPage />;
}
