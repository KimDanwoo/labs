import { initializeGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { difficultyAtom } from '@entities/sudoku/model/store/primitives';
import { options } from '@entities/sudoku/model/sudoku-game/constants/gameDifficultySelector';
import { type Difficulty } from '@entities/sudoku/model/types/game';
import { cn } from '@shared/lib/cn';
import { useAtomValue, useSetAtom } from 'jotai';

export const ListSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const initializeGame = useSetAtom(initializeGameAtom);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">새 게임</h4>
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
                isActive ? 'bg-primary text-on-primary' : 'bg-surface-primary/80 text-text-secondary shadow-sm',
                !isActive && ['hover:bg-surface-primary', 'hover:text-text-primary', 'hover:shadow-md'],
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
