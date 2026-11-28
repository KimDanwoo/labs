import type { ReactNode } from 'react';

import { GAME_LAYOUT, GAME_LAYOUT_COLUMNS, type GameLayoutSize } from '@shared/config/gameLayout';
import { cn } from '@shared/lib/cn';

interface GameLayoutRootProps {
  size?: GameLayoutSize;
  children: ReactNode;
}

export function GameLayoutRoot({ size = 'default', children }: GameLayoutRootProps) {
  return <main className={cn(GAME_LAYOUT.root, GAME_LAYOUT_COLUMNS[size])}>{children}</main>;
}
