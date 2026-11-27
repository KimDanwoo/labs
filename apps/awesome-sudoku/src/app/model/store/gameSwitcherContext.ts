'use client';

import { createContext } from 'react';

import type { GameSwitcher } from '@app/model/hooks/useGameSwitcher';
import type { ShelfGame } from '@entities/game-catalog';

export interface ActiveGameSwitcher extends Omit<GameSwitcher, 'currentGame'> {
  currentGame: ShelfGame;
}

export const GameSwitcherContext = createContext<ActiveGameSwitcher | null>(null);
