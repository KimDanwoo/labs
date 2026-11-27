'use client';

import { useContext } from 'react';

import { GameSwitcherContext, type ActiveGameSwitcher } from '@app/model/store/gameSwitcherContext';

export function useGameSwitcherContext(): ActiveGameSwitcher {
  const switcher = useContext(GameSwitcherContext);
  if (!switcher) throw new Error('GameSwitcher.Root 안에서만 사용할 수 있어요');
  return switcher;
}
