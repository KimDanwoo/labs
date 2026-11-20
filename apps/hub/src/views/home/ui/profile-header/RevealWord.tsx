import type { ReactNode } from 'react';

import { WORD_REVEAL } from '@views/home/config/motion';
import { revealDelay } from '@views/home/lib/revealDelay';

interface RevealWordProps {
  order: number;
  children: ReactNode;
}

export function RevealWord({ order, children }: RevealWordProps) {
  return (
    <span className="word-reveal" style={revealDelay(WORD_REVEAL.startDelayMs + order * WORD_REVEAL.staggerMs)}>
      {children}
    </span>
  );
}
