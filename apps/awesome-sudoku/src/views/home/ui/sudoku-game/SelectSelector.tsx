import { useAtomValue, useSetAtom } from 'jotai';

import { difficultyAtom, initializeGameAtom, type Difficulty } from '@entities/game';
import { cn } from '@shared/lib/cn';

import { options } from '../../model/sudoku-game/constants/gameDifficultySelector';
import styles from './SelectSelector.module.css';

export const SelectSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const initializeGame = useSetAtom(initializeGameAtom);

  return (
    <select
      aria-label="난이도 선택"
      name="difficulty"
      id="difficulty"
      value={difficulty}
      onChange={(e) => initializeGame(e.target.value as Difficulty)}
      className={cn(
        styles.select,
        'px-3 py-1.5 pr-8 bg-[rgb(var(--color-bg-tertiary))]/80 backdrop-blur-sm border-none rounded-lg text-sm font-normal text-[rgb(var(--color-text-primary))] cursor-pointer transition-all duration-200 ease-out hover:bg-[rgb(var(--color-bg-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-accent))]/40 appearance-none bg-no-repeat',
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
