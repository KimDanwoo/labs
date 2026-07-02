'use client';

import { MAX_MISTAKES } from '@entities/game/model/constants';
import { userAtom } from '@features/auth/model/atoms';
import { GoogleSignInButton } from '@features/auth/ui/GoogleSignInButton';
import { useSaveGameRecord } from '@features/game-record/model/hooks';
import { currentTimeAtom, isCompletedAtom, isSuccessAtom, mistakeCountAtom } from '@features/sudoku-game/model/atoms';
import { formatTime } from '@features/sudoku-game/model/utils';
import { useSnackbar } from '@shared/model/hooks';
import { cn } from '@shared/model/utils';
import { BottomSheet, Snackbar } from '@shared/ui';
import { useAtomValue } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { GameDifficultySelector } from './GameDifficultySelector';

const SuccessIcon = () => (
  <div
    className={cn(
      'w-16 h-16 mx-auto rounded-full',
      'bg-gradient-to-b',
      'from-emerald-400 to-emerald-500',
      'shadow-[0_8px_24px_rgba(16,185,129,0.3)]',
      'flex items-center justify-center',
    )}
  >
    <svg aria-hidden="true" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const FailureIcon = () => (
  <div
    className={cn(
      'w-16 h-16 mx-auto rounded-full',
      'bg-gradient-to-b from-rose-400 to-rose-500',
      'shadow-[0_8px_24px_rgba(244,63,94,0.3)]',
      'flex items-center justify-center',
    )}
  >
    <svg aria-hidden="true" className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </div>
);

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

  const [dismissed, setDismissed] = useState(false);
  const handleClose = useCallback(() => setDismissed(true), []);

  // 새 게임 시작 시 dismissed 초기화 — 렌더 중 상태 보정
  const [prevCompleted, setPrevCompleted] = useState(isCompleted);
  if (prevCompleted !== isCompleted) {
    setPrevCompleted(isCompleted);
    if (!isCompleted) setDismissed(false);
  }

  const snackbar = useSnackbar();
  const { show: showSnackbar } = snackbar;

  // 로그인 상태에서 게임 완료 시 자동 저장
  useEffect(() => {
    if (isCompleted && isSuccess && user) {
      saveRef.current().then((id) => {
        if (id) showSnackbar('기록이 저장되었습니다', 'success');
      });
    }
  }, [isCompleted, isSuccess, user, showSnackbar]);

  return (
    <>
      <BottomSheet
        isOpen={isCompleted && !dismissed}
        onClose={handleClose}
        title={isSuccess ? '축하합니다!' : '게임 오버'}
      >
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

            {/* 비로그인 상태: 로그인 유도 */}
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
