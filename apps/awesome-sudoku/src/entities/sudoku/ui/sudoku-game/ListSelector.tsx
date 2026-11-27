import { useAtomValue, useSetAtom } from 'jotai';

import { initializeGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { difficultyAtom } from '@entities/sudoku/model/store/primitives';
import { options } from '@entities/sudoku/model/sudoku-game/constants/gameDifficultySelector';
import { type Difficulty } from '@entities/sudoku/model/types/game';
import { Button } from '@shared/ui/button';

export const ListSelector = () => {
  const difficulty = useAtomValue(difficultyAtom);
  const initializeGame = useSetAtom(initializeGameAtom);

  return (
    <div className="grid gap-2.5">
      <h4 className="text-[13px] font-semibold text-text-tertiary">새 게임</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            size="l"
            variant={difficulty === option.value ? 'fill' : 'weak'}
            onClick={() => initializeGame(option.value as Difficulty)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
