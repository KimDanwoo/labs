import { PAUSE_OVERLAY } from '@entities/sudoku/config/board';
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
    <div className={PAUSE_OVERLAY.root}>
      <button aria-label="게임 계속하기" onClick={() => toggleTimer()} className={PAUSE_OVERLAY.resume}>
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
