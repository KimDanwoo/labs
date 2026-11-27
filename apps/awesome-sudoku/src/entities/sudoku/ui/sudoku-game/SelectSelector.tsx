import { useAtomValue, useSetAtom } from 'jotai';

import { requestNewGameAtom } from '@entities/sudoku/model/store/gameConfirmAtoms';
import { difficultyAtom } from '@entities/sudoku/model/store/primitives';
import { type Difficulty } from '@entities/sudoku/model/types/game';
import { cn } from '@shared/lib/cn';

import { options } from '@entities/sudoku/model/sudoku-game/constants/gameDifficultySelector';
import styles from '@entities/sudoku/ui/sudoku-game/SelectSelector.module.css';

export const SelectSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const requestNewGame = useSetAtom(requestNewGameAtom);

  return (
    <select
      aria-label="난이도 선택"
      name="difficulty"
      id="difficulty"
      value={difficulty}
      onChange={(e) => requestNewGame(e.target.value as Difficulty)}
      className={cn(
        styles.select,
        'h-11 cursor-pointer appearance-none rounded-full border-none bg-weak bg-no-repeat pr-9 pl-[18px] text-base font-semibold text-on-weak transition-colors duration-150 hover:bg-border-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
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
