'use client';

import { useState } from 'react';

const WEIGHT_STEP = 2.5;

const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-md border border-card-border bg-background text-center text-base font-medium text-foreground outline-none focus:border-primary';
const STEP_BUTTON_CLASS =
  'flex size-9 shrink-0 items-center justify-center rounded-md border border-card-border bg-glass text-lg font-medium text-foreground transition-colors hover:bg-primary-subtle';

type WeightCellProps = {
  initial: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
};

// 무게 입력 — 큰 변화는 타이핑, 미세조정은 ±2.5 버튼.
export function WeightCell({ initial, ariaLabel, onCommit }: WeightCellProps) {
  const [text, setText] = useState(initial > 0 ? String(initial) : '');

  const parse = (value: string): number => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const commit = (raw: string) => {
    setText(raw);
    onCommit(parse(raw));
  };

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.round((parse(text) + delta) * 10) / 10);
    setText(String(next));
    onCommit(next);
  };

  return (
    <div className="flex items-center gap-xs">
      <button
        type="button"
        aria-label={`${ariaLabel} ${WEIGHT_STEP} 감소`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => adjust(-WEIGHT_STEP)}
        className={STEP_BUTTON_CLASS}
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={text}
        onChange={(event) => commit(event.target.value)}
        placeholder="0"
        className={INPUT_CLASS}
      />
      <button
        type="button"
        aria-label={`${ariaLabel} ${WEIGHT_STEP} 증가`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => adjust(WEIGHT_STEP)}
        className={STEP_BUTTON_CLASS}
      >
        +
      </button>
    </div>
  );
}
