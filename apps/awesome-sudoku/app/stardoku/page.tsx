import { StardokuPage } from '@views/stardoku';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '별도쿠',
  description: '행·열·색 구역마다 별 하나 — 스테이지 진행형 논리 별 배치 퍼즐',
};

export default function Stardoku() {
  return <StardokuPage />;
}
