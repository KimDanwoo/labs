import type { CSSProperties } from 'react';

export function revealDelay(delayMs: number): CSSProperties {
  return { animationDelay: `${delayMs}ms` };
}
