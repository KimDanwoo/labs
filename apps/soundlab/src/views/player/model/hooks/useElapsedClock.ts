import { useRef } from 'react';

import { useFrame } from '@shared/lib/frame';
import { MS_PER_SECOND } from '../../config/time';
import { formatSeconds } from '../../lib/formatTrack';
import { frameState } from '../store/playback';

export function useElapsedClock() {
  const elapsedRef = useRef<HTMLElement | null>(null);
  const shownSeconds = useRef(-1);

  // 표시는 초 단위다. 매 프레임 쓰면 초당 60번 문자열을 만들고 그 줄을 다시 레이아웃한다 — 초가 바뀔 때만.
  useFrame(() => {
    const node = elapsedRef.current;
    if (!node) return;
    const seconds = Math.floor((frameState.position * frameState.durationMs) / MS_PER_SECOND);
    if (!Number.isFinite(seconds) || seconds === shownSeconds.current) return;
    shownSeconds.current = seconds;
    node.textContent = formatSeconds(seconds);
  });

  return elapsedRef;
}
