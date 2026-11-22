import { WallsPage } from '@views/walls';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '담쌓기',
  description: '말을 옮기고 담을 세워 컴퓨터보다 넓은 땅을 차지하는 담쌓기 게임.',
  alternates: { canonical: '/walls' },
};

export default function Walls() {
  return <WallsPage />;
}
