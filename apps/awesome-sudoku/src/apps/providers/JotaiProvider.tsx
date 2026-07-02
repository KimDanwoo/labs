'use client';

import { gameStore } from '@shared/model/store';
import { Provider } from 'jotai';
import { ReactNode } from 'react';

export function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider store={gameStore}>{children}</Provider>;
}
