'use client';
import { useAtomValue } from 'jotai';

import { MAX_MISTAKES } from '@entities/sudoku/config/game';
import { mistakeCountAtom } from '@entities/sudoku/model/store/primitives';
import { cn } from '@shared/lib/cn';
import { StatusPill } from '@shared/ui/status-pill';

export function MistakeCounter() {
  const mistakeCount = useAtomValue(mistakeCountAtom);
  const isNearLimit = mistakeCount >= MAX_MISTAKES - 1;

  return (
    <StatusPill.Root tone="weak" className={cn(isNearLimit && 'text-error-text')}>
      오답 {mistakeCount}/{MAX_MISTAKES}
    </StatusPill.Root>
  );
}
