'use client';

import { BIG_BOARD_SIZE, BIG_STAGE_STEP, GAME_OVER_PENALTY } from '@entities/stardoku/model/constants';
import {
  hintsRemainingAtom,
  isClearedAtom,
  isGameOverAtom,
  nextStageAtom,
  retreatStageAtom,
  scoreAtom,
  stageAtom,
} from '@features/stardoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { BottomSheet } from '@shared/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useState } from 'react';

const ClearIcon = () => (
  <div
    className={cn(
      'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
      'bg-gradient-to-b from-amber-400 to-orange-500',
      'shadow-[0_8px_24px_rgba(245,158,11,0.3)]',
    )}
  >
    <svg aria-hidden="true" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.28L18.18 20 12 16.56 5.82 20l1.43-6.45L2.5 9.27l6.6-1.01L12 2z" />
    </svg>
  </div>
);

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

export const StardokuResultSheet = memo(() => {
  const isCleared = useAtomValue(isClearedAtom);
  const isGameOver = useAtomValue(isGameOverAtom);
  const stage = useAtomValue(stageAtom);
  const score = useAtomValue(scoreAtom);
  const earnedPoints = useAtomValue(hintsRemainingAtom);
  const nextStage = useSetAtom(nextStageAtom);
  const retreatStage = useSetAtom(retreatStageAtom);

  const isOpen = isCleared || isGameOver;
  const [dismissed, setDismissed] = useState(false);
  const handleClose = useCallback(() => setDismissed(true), []);

  // 새 판 시작 시 dismissed 초기화 — 렌더 중 상태 보정
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (!isOpen) setDismissed(false);
  }

  const nextIsBigStage = (stage + 1) % BIG_STAGE_STEP === 0;
  const clearedDescription = nextIsBigStage
    ? `STAGE ${stage} 완료 — 다음은 ${BIG_BOARD_SIZE}×${BIG_BOARD_SIZE} 대형판!`
    : `STAGE ${stage} 완료 — 별을 모두 찾았어요`;

  return (
    <BottomSheet
      isOpen={isOpen && !dismissed}
      onClose={handleClose}
      title={isCleared ? '스테이지 클리어!' : '게임 오버'}
    >
      <div className="space-y-4 text-center">
        {isCleared ? <ClearIcon /> : <GameOverIcon />}
        <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>
          {isCleared
            ? clearedDescription
            : `목숨을 모두 잃었어요 — ${GAME_OVER_PENALTY}점 감점, 이전 스테이지부터 다시!`}
        </p>
        <p className={cn('text-lg font-bold font-tabular', 'text-[rgb(var(--color-text-primary))]')}>
          {isCleared ? `+${earnedPoints}점` : `−${GAME_OVER_PENALTY}점`}
          <span className={cn('ml-2 text-xs font-medium', 'text-[rgb(var(--color-text-tertiary))]')}>
            누적 {score}점
          </span>
        </p>
        <button
          type="button"
          onClick={() => (isCleared ? nextStage() : retreatStage())}
          className={cn(
            'w-full rounded-2xl py-3.5 text-[15px] font-bold text-white',
            'bg-gradient-to-b from-blue-500 to-indigo-600',
            'shadow-[0_8px_24px_rgba(59,130,246,0.3)]',
            'transition-transform active:scale-[0.98]',
          )}
        >
          {isCleared ? '다음 스테이지 →' : '이전 스테이지로'}
        </button>
      </div>
    </BottomSheet>
  );
});

StardokuResultSheet.displayName = 'StardokuResultSheet';

export default StardokuResultSheet;
