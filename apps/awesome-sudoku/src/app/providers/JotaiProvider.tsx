'use client';

import { gameStore } from '@entities/game';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';

export function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider store={gameStore}>{children}</Provider>;
}
