import type { Metadata } from 'next';

import { KillerSudokuPage } from '@views/killer-sudoku';

export const metadata: Metadata = {
  title: '킬러 스도쿠',
  description: '숫자 대신 점선 케이지와 그 합만 주어지는 킬러 스도쿠를 광고 없이 풀어 보세요.',
  alternates: { canonical: '/killer' },
};

export default function KillerPage() {
  return <KillerSudokuPage />;
}
