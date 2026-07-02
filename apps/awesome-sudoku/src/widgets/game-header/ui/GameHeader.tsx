'use client';

import { MAX_MISTAKES } from '@entities/game/model/constants';
import { mistakeCountAtom } from '@features/sudoku-game/model/atoms';
import { GameDifficultySelector, TimerControl } from '@features/sudoku-game/ui';
import { cn } from '@shared/model/utils';
import { useAtomValue } from 'jotai';
import { FC } from 'react';

const MistakeCounter: FC = () => {
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

export const GameStatus: FC = () => (
  <div className="w-full flex items-center justify-between">
    <GameDifficultySelector.Select />
    <MistakeCounter />
    <TimerControl />
  </div>
);

export default GameStatus;
