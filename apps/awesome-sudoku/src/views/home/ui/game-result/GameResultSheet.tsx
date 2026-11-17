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
import { memo, useCallback } from 'react';
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
  const snackbar = useSnackbar();
  const { show: showSnackbar } = snackbar;
  const handleSaved = useCallback(() => showSnackbar('기록이 저장되었습니다', 'success'), [showSnackbar]);
  const { save, isSaving, error: saveError, pointResult } = useSaveGameRecord({ onSaved: handleSaved });

  const { isOpen: isSheetOpen, dismiss } = useDismissible(isCompleted);

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

            {saveError && !isSaving && (
              <div className="space-y-2 pt-2">
                <p className={cn('text-sm', 'text-[rgb(var(--color-error))]')}>기록을 저장하지 못했어요.</p>
                <button
                  type="button"
                  onClick={save}
                  className={cn('text-sm font-bold underline underline-offset-4', 'text-[rgb(var(--color-accent))]')}
                >
                  다시 저장하기
                </button>
              </div>
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
