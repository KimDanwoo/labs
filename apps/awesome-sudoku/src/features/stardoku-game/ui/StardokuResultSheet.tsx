'use client';

import { GAME_OVER_PENALTY } from '@entities/stardoku/model/constants';
import { isGameOverAtom, retreatStageAtom, scoreAtom, stageAtom } from '@features/stardoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { BottomSheet } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useState } from 'react';

const GameOverIcon = () => (
  <div
    className={cn(
      'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
      'bg-gradient-to-b from-rose-400 to-rose-500',
      'shadow-[0_8px_24px_rgba(244,63,94,0.3)]',
    )}
  >
    <svg aria-hidden="true" className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

/** 게임 오버 전용. 클리어는 보드 연출 + 자동 진행으로 처리해 매 판 클릭을 없앴다 */
export const StardokuResultSheet = memo(() => {
  const isGameOver = useAtomValue(isGameOverAtom);
  const stage = useAtomValue(stageAtom);
  const score = useAtomValue(scoreAtom);
  const retreatStage = useSetAtom(retreatStageAtom);

  const [dismissed, setDismissed] = useState(false);
  const handleClose = useCallback(() => setDismissed(true), []);

  // 새 판 시작 시 dismissed 초기화 — 렌더 중 상태 보정
  const [prevGameOver, setPrevGameOver] = useState(isGameOver);
  if (prevGameOver !== isGameOver) {
    setPrevGameOver(isGameOver);
    if (!isGameOver) setDismissed(false);
  }

  return (
    <BottomSheet isOpen={isGameOver && !dismissed} onClose={handleClose} title="게임 오버">
      <div className="space-y-4 text-center">
        <GameOverIcon />
        <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>
          {`목숨을 모두 잃었어요 — ${GAME_OVER_PENALTY}점 감점, STAGE ${Math.max(1, stage - 1)}부터 다시!`}
        </p>
        <p className={cn('text-lg font-bold font-tabular', 'text-[rgb(var(--color-text-primary))]')}>
          −{GAME_OVER_PENALTY}점
          <span className={cn('ml-2 text-xs font-medium', 'text-[rgb(var(--color-text-tertiary))]')}>
            누적 {score}점
          </span>
        </p>
        <button
          type="button"
          onClick={() => retreatStage()}
          className={cn(
            'w-full rounded-2xl py-3.5 text-[15px] font-bold text-white',
            'bg-gradient-to-b from-blue-500 to-indigo-600',
            'shadow-[0_8px_24px_rgba(59,130,246,0.3)]',
            'transition-transform active:scale-[0.98]',
          )}
        >
          이전 스테이지로
        </button>
      </div>
    </BottomSheet>
  );
});

StardokuResultSheet.displayName = 'StardokuResultSheet';

export default StardokuResultSheet;
