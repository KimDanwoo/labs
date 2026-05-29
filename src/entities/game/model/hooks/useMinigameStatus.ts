'use client';

import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { MINIGAME_COOLDOWN_MS } from '@shared/constants';
import { lastMinigameAtAtom } from '../store';

export type MinigameStatus = {
  canPlay: boolean;
  cooldownRemainingMs: number;
};

export function useMinigameStatus(): MinigameStatus {
  const lastAt = useAtomValue(lastMinigameAtAtom);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lastAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lastAt]);

  const elapsed = lastAt === null ? Infinity : now - lastAt;
  const cooldownRemainingMs = Math.max(0, MINIGAME_COOLDOWN_MS - elapsed);

  return {
    canPlay: cooldownRemainingMs === 0,
    cooldownRemainingMs,
  };
}
