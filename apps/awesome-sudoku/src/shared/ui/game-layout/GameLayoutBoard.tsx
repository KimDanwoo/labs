import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutBoardProps {
  children: ReactNode;
}

export function GameLayoutBoard({ children }: GameLayoutBoardProps) {
  return <div className={GAME_LAYOUT.board}>{children}</div>;
}
