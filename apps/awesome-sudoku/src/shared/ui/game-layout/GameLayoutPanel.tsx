import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutPanelProps {
  children: ReactNode;
}

export function GameLayoutPanel({ children }: GameLayoutPanelProps) {
  return <div className={GAME_LAYOUT.panel}>{children}</div>;
}
