import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutStatusProps {
  children: ReactNode;
}

export function GameLayoutStatus({ children }: GameLayoutStatusProps) {
  return <div className={GAME_LAYOUT.status}>{children}</div>;
}
