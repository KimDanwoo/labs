'use client';

import type { ExercisePerformance } from '@entities/session/model/types';
import { Button } from '@ui/react';
import { useState } from 'react';

type SetTableProps = {
  performance: ExercisePerformance;
  onUpdate: (setIndex: number, patch: { reps: number; weight: number }) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
};

const WEIGHT_STEP = 2.5;

const INPUT_CLASS =
  'h-11 w-full min-w-0 rounded-md border border-card-border bg-background text-center text-base font-medium text-foreground outline-none focus:border-primary';
const STEP_BUTTON_CLASS =
  'flex size-9 shrink-0 items-center justify-center rounded-md border border-card-border bg-glass text-lg font-medium text-foreground transition-colors hover:bg-primary-subtle';

// 횟수 칸 — 그냥 타이핑(빈칸 허용). 커밋만 숫자로 넘긴다.
function RepsCell({
  initial,
  ariaLabel,
  onCommit,
}: {
  initial: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
}) {
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

// 무게 칸 — 큰 변화는 타이핑, 미세조정은 ±2.5 버튼(셀 안에서 직접 처리해 동기화 이슈 없음).
function WeightCell({
  initial,
  ariaLabel,
  onCommit,
}: {
  initial: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
}) {
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

export function SetTable({ performance, onUpdate, onRemoveSet, onAddSet }: SetTableProps) {
  const canRemove = performance.sets.length > 1;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-sm px-xs text-xs text-muted">
        <span className="w-6 shrink-0 text-center">세트</span>
        <span className="flex-2 text-center">무게(kg)</span>
        <span className="flex-1 text-center">횟수</span>
        <span className="w-6 shrink-0" />
      </div>

      {performance.sets.map((set, index) => (
        <div key={set.setIndex} className="flex items-center gap-sm">
          <span className="w-6 shrink-0 text-center text-sm font-medium text-muted">{index + 1}</span>
          <div className="flex-2">
            <WeightCell
              initial={set.weight}
              ariaLabel={`${index + 1}세트 무게`}
              onCommit={(weight) => onUpdate(index, { weight, reps: set.reps })}
            />
          </div>
          <div className="flex-1">
            <RepsCell
              initial={set.reps}
              ariaLabel={`${index + 1}세트 횟수`}
              onCommit={(reps) => onUpdate(index, { reps, weight: set.weight })}
            />
          </div>
          <button
            type="button"
            aria-label={`${index + 1}세트 삭제`}
            disabled={!canRemove}
            onClick={() => onRemoveSet(index)}
            className="w-6 shrink-0 text-center text-lg text-muted transition-colors hover:text-error disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}

      <Button variant="outline" className="mt-xs h-11 w-full" onClick={onAddSet}>
        + 세트
      </Button>
    </div>
  );
}
