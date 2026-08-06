import {
  applyHintAtom,
  hintsRemainingAtom,
  regeneratePuzzleAtom,
  restartBoardAtom,
} from '@features/stardoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';

const controlButtonClass = cn(
  'flex-1 rounded-xl py-3 text-sm font-semibold',
  'border border-[rgb(var(--color-border-light))]',
  'bg-[rgb(var(--color-glass))]/70 backdrop-blur-sm',
  'text-[rgb(var(--color-text-primary))]',
  'transition-colors hover:border-blue-500 hover:text-blue-500',
  'disabled:pointer-events-none disabled:opacity-40',
);

export const StardokuControls = memo(() => {
  const hintsRemaining = useAtomValue(hintsRemainingAtom);
  const applyHint = useSetAtom(applyHintAtom);
  const restartBoard = useSetAtom(restartBoardAtom);
  const regeneratePuzzle = useSetAtom(regeneratePuzzleAtom);

  return (
    <div className="flex w-full gap-2.5">
      <button type="button" onClick={() => applyHint()} disabled={hintsRemaining <= 0} className={controlButtonClass}>
        💡 힌트 {hintsRemaining}
      </button>
      <button type="button" onClick={() => restartBoard()} className={controlButtonClass}>
        다시 시작
      </button>
      <button type="button" onClick={() => regeneratePuzzle()} className={controlButtonClass}>
        새 퍼즐
      </button>
    </div>
  );
});

StardokuControls.displayName = 'StardokuControls';
