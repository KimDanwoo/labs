'use client';
import { MAX_MISTAKES } from '@entities/sudoku/config/game';
import { mistakeCountAtom } from '@entities/sudoku/model/store/primitives';
import { cn } from '@shared/lib/cn';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';

export const MistakeCounter: FC = () => {
  const mistakeCount = useAtomValue(mistakeCountAtom);

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm',
        'font-normal font-tabular',
        mistakeCount >= MAX_MISTAKES - 1 ? 'text-error-text' : 'text-text-secondary',
      )}
    >
      <span>오답</span>
      <span>
        {mistakeCount}/{MAX_MISTAKES}
      </span>
    </div>
  );
};
