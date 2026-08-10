import { applyHintAtom, hintsRemainingAtom, restartBoardAtom } from '@features/stardoku-game/model/atoms';
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

/** 같은 스테이지에서 판을 다시 뽑는 수단은 두지 않는다 — 누적 점수가 랭킹이라 쉬운 판이 나올 때까지 돌릴 수 있다 */
export const StardokuControls = memo(() => {
  const hintsRemaining = useAtomValue(hintsRemainingAtom);
  const applyHint = useSetAtom(applyHintAtom);
  const restartBoard = useSetAtom(restartBoardAtom);

  return (
    <div className="flex w-full gap-2.5">
      <button type="button" onClick={() => applyHint()} disabled={hintsRemaining <= 0} className={controlButtonClass}>
        💡 힌트 {hintsRemaining}
      </button>
      <button type="button" onClick={() => restartBoard()} className={controlButtonClass}>
        다시 시작
      </button>
    </div>
  );
});

StardokuControls.displayName = 'StardokuControls';
