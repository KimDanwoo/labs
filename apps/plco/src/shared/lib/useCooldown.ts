'use client';

import { useEffect, useState } from 'react';

export type Cooldown = {
  now: number;
  remainingMs: number;
  isReady: boolean;
};

export function useCooldown(
  lastAt: number | null,
  cooldownMs: number,
): Cooldown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lastAt === null) return;
    if (Date.now() - lastAt >= cooldownMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lastAt, cooldownMs]);

  const elapsed = lastAt === null ? Infinity : now - lastAt;
  const remainingMs = Math.max(0, cooldownMs - elapsed);

  return { now, remainingMs, isReady: remainingMs === 0 };
}
