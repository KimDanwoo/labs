'use client';

import { useState } from 'react';

const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-md border border-card-border bg-background text-center text-base font-medium text-foreground outline-none focus:border-primary';

type RepsCellProps = {
  initial: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
};

// 횟수 입력 — 타이핑만(빈칸 허용). 커밋 시 숫자로 변환.
export function RepsCell({ initial, ariaLabel, onCommit }: RepsCellProps) {
  const [text, setText] = useState(initial > 0 ? String(initial) : '');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setText(raw);
    const parsed = Number.parseInt(raw, 10);
    onCommit(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={ariaLabel}
      value={text}
      onChange={handleChange}
      placeholder="0"
      className={INPUT_CLASS}
    />
  );
}
