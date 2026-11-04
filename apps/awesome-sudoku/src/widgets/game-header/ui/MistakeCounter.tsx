'use client';
import { MAX_MISTAKES } from '@entities/game/model/constants';
import { mistakeCountAtom } from '@entities/game/model/store';
import { cn } from '@shared/model/utils';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';

export const MistakeCounter: FC = () => {
  const mistakeCount = useAtomValue(mistakeCountAtom);

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm',
        'font-medium font-tabular',
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
