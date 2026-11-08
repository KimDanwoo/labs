import { difficultyAtom, initializeGameAtom } from '@entities/game/model/store';
import type { Difficulty } from '@entities/game/model/types';
import { options } from '@features/sudoku-game/model/constants';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';

export const ListSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const initializeGame = useSetAtom(initializeGameAtom);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-[rgb(var(--color-text-tertiary))] uppercase tracking-wider mb-1">
        새 게임
      </h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = difficulty === option.value;
          return (
            <button
              key={option.value}
              onClick={() => initializeGame(option.value as Difficulty)}
              className={cn(
                'px-4 py-2 rounded-xl',
                'text-sm font-normal',
                'transition-all duration-200 ease-out',
                'active:scale-95',
                isActive
                  ? [
                      'bg-gradient-to-b',
                      'from-[rgb(var(--color-gradient-from))]',
                      'to-[rgb(var(--color-gradient-to))]',
                      'text-white',
                      'shadow-[0_4px_12px_rgba(var(--color-gradient-from),0.3)]',
                    ]
                  : [
                      'bg-[rgb(var(--color-surface-primary))]/80',
                      'text-[rgb(var(--color-text-secondary))]',
                      'shadow-sm',
                    ],
                !isActive && [
                  'hover:bg-[rgb(var(--color-surface-primary))]',
                  'hover:text-[rgb(var(--color-text-primary))]',
                  'hover:shadow-md',
                ],
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
