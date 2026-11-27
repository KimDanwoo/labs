'use client';

import { useSyncExternalStore } from 'react';

import { formatKoreanDate } from '@views/game-library/lib/formatKoreanDate';

const subscribeNothing = () => () => {};
const readTodayLabel = () => formatKoreanDate(new Date());
const readServerLabel = () => '';

export function useTodayLabel(): string {
  return useSyncExternalStore(subscribeNothing, readTodayLabel, readServerLabel);
}
