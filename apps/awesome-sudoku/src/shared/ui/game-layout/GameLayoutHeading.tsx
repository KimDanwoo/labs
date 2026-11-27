import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutHeadingProps {
  children: ReactNode;
}

export function GameLayoutHeading({ children }: GameLayoutHeadingProps) {
  return <div className={GAME_LAYOUT.heading}>{children}</div>;
}
