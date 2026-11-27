import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutTitleProps {
  children: ReactNode;
}

export function GameLayoutTitle({ children }: GameLayoutTitleProps) {
  return <h1 className={GAME_LAYOUT.title}>{children}</h1>;
}
