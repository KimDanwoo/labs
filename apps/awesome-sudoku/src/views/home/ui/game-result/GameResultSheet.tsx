'use client';
import {
  MAX_MISTAKES,
  currentTimeAtom,
  formatTime,
  isCompletedAtom,
  isSuccessAtom,
  mistakeCountAtom,
} from '@entities/game';
import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { useAtomValue } from 'jotai';
import { memo } from 'react';
import { FailureIcon } from '../sudoku-game/FailureIcon';
import { ListSelector } from '../sudoku-game/ListSelector';
import { SuccessIcon } from '../sudoku-game/SuccessIcon';

export const GameResultSheet = memo(() => {
  const isCompleted = useAtomValue(isCompletedAtom);
  const isSuccess = useAtomValue(isSuccessAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const mistakeCount = useAtomValue(mistakeCountAtom);

  const { isOpen: isSheetOpen, dismiss } = useDismissible(isCompleted);

  return (
    <BottomSheet isOpen={isSheetOpen} onClose={dismiss} title={isSuccess ? '축하합니다!' : '게임 오버'}>
      {isSuccess ? (
        <div className="text-center space-y-4">
          <SuccessIcon />

          <div>
            <p className="text-sm text-[rgb(var(--color-text-secondary))]">완료 시간</p>
            <p className="text-3xl font-bold font-tabular text-[rgb(var(--color-text-primary))]">
              {formatTime(currentTime)}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <FailureIcon />
          <p className="text-[rgb(var(--color-text-secondary))]">
            오답 {mistakeCount}/{MAX_MISTAKES}회로 게임이 종료되었습니다.
          </p>
        </div>
      )}

      <div className="mt-6">
        <ListSelector />
      </div>
    </BottomSheet>
  );
});

GameResultSheet.displayName = 'GameResultSheet';
