'use client';
import {
  MAX_MISTAKES,
  currentTimeAtom,
  formatTime,
  isCompletedAtom,
  isSuccessAtom,
  mistakeCountAtom,
} from '@entities/game';
import { userAtom } from '@entities/session';
import { cn } from '@shared/lib/cn';
import { useDismissible } from '@shared/lib/useDismissible';
import { useSnackbar } from '@shared/lib/useSnackbar';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Snackbar } from '@shared/ui/Snackbar';
import { useAtomValue } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { useSaveGameRecord } from '../../model/game-record/hooks/useSaveGameRecord';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { FailureIcon } from '../sudoku-game/FailureIcon';
import { GameDifficultySelector } from '../sudoku-game/GameDifficultySelector';
import { SuccessIcon } from '../sudoku-game/SuccessIcon';

export const GameResultSheet = memo(() => {
  const isCompleted = useAtomValue(isCompletedAtom);
  const isSuccess = useAtomValue(isSuccessAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const mistakeCount = useAtomValue(mistakeCountAtom);

  const user = useAtomValue(userAtom);
  const { save, isSaving, pointResult } = useSaveGameRecord();
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const { isOpen: isSheetOpen, dismiss } = useDismissible(isCompleted);

  const snackbar = useSnackbar();
  const { show: showSnackbar } = snackbar;

  useEffect(() => {
    if (isCompleted && isSuccess && user) {
      saveRef.current().then((id) => {
        if (id) showSnackbar('기록이 저장되었습니다', 'success');
      });
    }
  }, [isCompleted, isSuccess, user, showSnackbar]);

  return (
    <>
      <BottomSheet isOpen={isSheetOpen} onClose={dismiss} title={isSuccess ? '축하합니다!' : '게임 오버'}>
        {isSuccess ? (
          <div className="text-center space-y-4">
            <SuccessIcon />

            <div>
              <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>완료 시간</p>
              <p
                className={cn('text-3xl font-mono font-bold', 'font-tabular', 'text-[rgb(var(--color-text-primary))]')}
              >
                {formatTime(currentTime)}
              </p>
            </div>

            {pointResult && (
              <div>
                <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>획득 포인트</p>
                <p
                  className={cn(
                    'text-5xl font-bold font-tabular',
                    'bg-gradient-to-r',
                    'from-amber-500 to-orange-500',
                    'bg-clip-text text-transparent',
                  )}
                >
                  +{pointResult.totalPoint}
                </p>
                {pointResult.killerDeduction > 0 && (
                  <p className={cn('text-xs mt-1', 'text-[rgb(var(--color-text-tertiary))]')}>
                    기본 {pointResult.basePoint}점 - 킬러 {pointResult.killerDeduction}점
                  </p>
                )}
              </div>
            )}

            {isSaving && (
              <p className={cn('text-xs animate-pulse', 'text-[rgb(var(--color-text-tertiary))]')}>기록 저장 중...</p>
            )}

            {!user && !isSaving && (
              <div className="space-y-3 pt-2">
                <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>
                  기록을 저장하려면 로그인하세요
                </p>
                <GoogleSignInButton />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <FailureIcon />
            <p className={cn('text-[rgb(var(--color-text-secondary))]')}>
              오답 {mistakeCount}/{MAX_MISTAKES}회로 게임이 종료되었습니다.
            </p>
          </div>
        )}

        <div className="mt-6">
          <GameDifficultySelector.List />
        </div>
      </BottomSheet>

      <Snackbar
        message={snackbar.message}
        isVisible={snackbar.isVisible}
        onClose={snackbar.hide}
        variant={snackbar.variant}
      />
    </>
  );
});

GameResultSheet.displayName = 'GameResultSheet';
