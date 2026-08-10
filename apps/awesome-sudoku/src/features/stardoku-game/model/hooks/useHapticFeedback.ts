import { isClearedAtom, livesAtom } from '@features/stardoku-game/model/atoms';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

/** 규칙 위반 — 짧고 단호하게 */
const VIOLATION_PATTERN = 45;
/** 클리어 — 리듬으로 성취를 알린다 */
const CLEAR_PATTERN = [25, 45, 55] as const;

const vibrate = (pattern: number | readonly number[]): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern as number | number[]);
};

/**
 * 목숨이 줄거나 판을 클리어할 때 진동으로 알린다.
 * 모바일에서는 작은 셀을 보느라 시선이 보드에 묶여 하트 UI 변화를 놓치기 쉽다.
 * iOS Safari는 navigator.vibrate를 지원하지 않아 안드로이드에서만 동작한다.
 */
export const useHapticFeedback = (): void => {
  const lives = useAtomValue(livesAtom);
  const isCleared = useAtomValue(isClearedAtom);
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives < prevLives.current) vibrate(VIOLATION_PATTERN);
    prevLives.current = lives;
  }, [lives]);

  useEffect(() => {
    if (isCleared) vibrate(CLEAR_PATTERN);
  }, [isCleared]);
};
