'use client';

import type { ReactNode } from 'react';

import { useGameSwitcher } from '@app/model/hooks/useGameSwitcher';
import { GameSwitcherContext } from '@app/model/store/gameSwitcherContext';

interface GameSwitcherRootProps {
  children: ReactNode;
}

export function GameSwitcherRoot({ children }: GameSwitcherRootProps) {
  const { currentGame, ...switcher } = useGameSwitcher();
  if (!currentGame) return null;

  return <GameSwitcherContext.Provider value={{ ...switcher, currentGame }}>{children}</GameSwitcherContext.Provider>;
}
