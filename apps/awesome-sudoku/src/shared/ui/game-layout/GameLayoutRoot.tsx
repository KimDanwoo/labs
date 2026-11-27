import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutRootProps {
  children: ReactNode;
}

export function GameLayoutRoot({ children }: GameLayoutRootProps) {
  return <main className={GAME_LAYOUT.root}>{children}</main>;
}
