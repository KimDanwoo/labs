import { GAME_PHASE } from '@views/home/config/game';
import { initializeGameAtom } from '@views/home/model/store/gameLifecycleAtoms';
import { difficultyAtom } from '@views/home/model/store/primitives';
import { gamePhaseAtom } from '@views/home/model/store/statusAtoms';
import { toggleTimerAtom } from '@views/home/model/store/timerAtoms';
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-glass/(--overlay-opacity) backdrop-blur-md">
      <button
        aria-label="게임 계속하기"
        onClick={() => toggleTimer()}
        className="flex flex-col items-center gap-4 p-8 rounded-3xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div className="w-20 h-20 rounded-full bg-linear-to-b from-gradient-from to-gradient-to shadow-[0_8px_32px_rgba(var(--rgb-gradient-from),0.4)] flex items-center justify-center transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(var(--rgb-gradient-from),0.5)]">
          <VscPlay className="text-white text-3xl ml-1" />
        </div>
        <span className="text-sm font-normal text-text-secondary">탭하여 계속하기</span>
      </button>

      <button
        onClick={() => initializeGame(difficulty)}
        className="px-6 py-2.5 rounded-xl text-sm font-normal text-text-secondary bg-surface-primary/60 border border-border-light/50 transition-all duration-200 hover:bg-surface-primary hover:text-text-primary active:scale-95"
      >
        새 게임
      </button>
    </div>
  );
};

export default PauseGameOverlay;
