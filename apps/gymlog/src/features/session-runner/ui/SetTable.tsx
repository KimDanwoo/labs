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

type NumberCellProps = {
  initial: number;
  decimal?: boolean;
  ariaLabel: string;
  onCommit: (value: number) => void;
};

// 입력 도중 자유롭게 타이핑(빈칸·소수점)하도록 로컬 문자열로 들고, 커밋만 숫자로 넘긴다.
function NumberCell({ initial, decimal = false, ariaLabel, onCommit }: NumberCellProps) {
  const [text, setText] = useState(initial > 0 ? String(initial) : '');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setText(raw);
    const parsed = decimal ? Number.parseFloat(raw) : Number.parseInt(raw, 10);
    onCommit(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      aria-label={ariaLabel}
      value={text}
      onChange={handleChange}
      placeholder="0"
      className="h-11 w-full min-w-0 rounded-md border border-card-border bg-background text-center text-base font-medium text-foreground outline-none focus:border-primary"
    />
  );
}

export function SetTable({ performance, onUpdate, onRemoveSet, onAddSet }: SetTableProps) {
  const canRemove = performance.sets.length > 1;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-sm px-xs text-xs text-muted">
        <span className="w-7 shrink-0 text-center">세트</span>
        <span className="flex-1 text-center">무게(kg)</span>
        <span className="flex-1 text-center">횟수</span>
        <span className="w-7 shrink-0" />
      </div>

      {performance.sets.map((set, index) => (
        <div key={set.setIndex} className="flex items-center gap-sm">
          <span className="w-7 shrink-0 text-center text-sm font-medium text-muted">{index + 1}</span>
          <div className="flex-1">
            <NumberCell
              initial={set.weight}
              decimal
              ariaLabel={`${index + 1}세트 무게`}
              onCommit={(weight) => onUpdate(index, { weight, reps: set.reps })}
            />
          </div>
          <div className="flex-1">
            <NumberCell
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
            className="w-7 shrink-0 text-center text-lg text-muted transition-colors hover:text-error disabled:opacity-30"
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
