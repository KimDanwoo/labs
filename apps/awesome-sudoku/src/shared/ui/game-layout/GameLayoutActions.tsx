import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutActionsProps {
  children: ReactNode;
}

export function GameLayoutActions({ children }: GameLayoutActionsProps) {
  return <div className={GAME_LAYOUT.actions}>{children}</div>;
}
