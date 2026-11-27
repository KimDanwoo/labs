import { GAME_PHASE } from '@entities/sudoku/config/game';
import { initializeGameAtom } from '@entities/sudoku/model/store/gameLifecycleAtoms';
import { difficultyAtom } from '@entities/sudoku/model/store/primitives';
import { gamePhaseAtom } from '@entities/sudoku/model/store/statusAtoms';
import { toggleTimerAtom } from '@entities/sudoku/model/store/timerAtoms';
import { Button } from '@shared/ui/button';
import { useAtomValue, useSetAtom } from 'jotai';
import type { FC } from 'react';
import { VscPlay } from 'react-icons/vsc';

export const PauseGameOverlay: FC = () => {
  const gamePhase = useAtomValue(gamePhaseAtom);
  const toggleTimer = useSetAtom(toggleTimerAtom);
  const initializeGame = useSetAtom(initializeGameAtom);
  const difficulty = useAtomValue(difficultyAtom);

  if (gamePhase !== GAME_PHASE.PAUSED) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-surface-primary">
      <button
        aria-label="게임 계속하기"
        onClick={() => toggleTimer()}
        className="flex flex-col items-center gap-4 p-8 rounded-3xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
          <VscPlay className="text-on-primary text-3xl ml-1" />
        </div>
        <span className="text-sm font-normal text-text-secondary">탭하여 계속하기</span>
      </button>

      <Button variant="weak" onClick={() => initializeGame(difficulty)}>
        새 게임
      </Button>
    </div>
  );
};

export default PauseGameOverlay;
