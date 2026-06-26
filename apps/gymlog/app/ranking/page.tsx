import { RankingView } from '@views/ranking/RankingView';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '랭킹' };

export default function RankingPage() {
  return <RankingView />;
}
