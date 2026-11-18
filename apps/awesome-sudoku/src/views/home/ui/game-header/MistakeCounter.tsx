'use client';
import { cn } from '@shared/lib/cn';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';
import { MAX_MISTAKES } from '../../config/game';
import { mistakeCountAtom } from '../../model/store/primitives';

export const MistakeCounter: FC = () => {
  const mistakeCount = useAtomValue(mistakeCountAtom);

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm',
        'font-normal font-tabular',
        mistakeCount >= MAX_MISTAKES - 1
          ? 'text-[rgb(var(--color-error-text))]'
          : 'text-[rgb(var(--color-text-secondary))]',
      )}
    >
      <span>오답</span>
      <span>
        {mistakeCount}/{MAX_MISTAKES}
      </span>
    </div>
  );
};
