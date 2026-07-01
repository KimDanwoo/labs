'use client';

import { useAtomValue } from 'jotai';
import { MINIGAME_COOLDOWN_MS } from '@shared/constants';
import { useCooldown } from '@shared/lib';
import { lastMinigameAtAtom } from '../store';

export type MinigameStatus = {
  canPlay: boolean;
  cooldownRemainingMs: number;
};

export function useMinigameStatus(): MinigameStatus {
  const lastAt = useAtomValue(lastMinigameAtAtom);
  const { remainingMs, isReady } = useCooldown(lastAt, MINIGAME_COOLDOWN_MS);

  return {
    canPlay: isReady,
    cooldownRemainingMs: remainingMs,
  };
}
