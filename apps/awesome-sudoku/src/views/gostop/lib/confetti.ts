import { CONFETTI_START_MS } from '@views/gostop/config/result';
import type { CSSProperties } from 'react';

export interface ConfettiPiece {
  left: number;
  delayMs: number;
  turn: number;
}

export const confettiStyle = ({ left, delayMs, turn }: ConfettiPiece): CSSProperties =>
  ({
    left: `${left}%`,
    animationDelay: `${delayMs + CONFETTI_START_MS}ms`,
    '--turn': `${turn}deg`,
  }) as CSSProperties;
