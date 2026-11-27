import type { ReactNode } from 'react';

import { GAME_LAYOUT } from '@shared/config/gameLayout';

interface GameLayoutDescriptionProps {
  children: ReactNode;
}

export function GameLayoutDescription({ children }: GameLayoutDescriptionProps) {
  return <p className={GAME_LAYOUT.description}>{children}</p>;
}
