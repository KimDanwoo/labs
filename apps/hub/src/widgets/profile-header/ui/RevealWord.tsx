import type { ReactNode } from 'react';

/** 헤드라인 단어가 하나씩 떠오르는 간격(ms). 라벨 등장 직후 시작한다. */
const WORD_STAGGER_MS = 110;
const WORD_START_DELAY_MS = 120;

type RevealWordProps = { order: number; children: ReactNode };

export function RevealWord({ order, children }: RevealWordProps) {
  return (
    <span className="word-reveal" style={{ animationDelay: `${WORD_START_DELAY_MS + order * WORD_STAGGER_MS}ms` }}>
      {children}
    </span>
  );
}
