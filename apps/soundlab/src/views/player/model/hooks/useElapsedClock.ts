import { useRef } from 'react';

import { useFrame } from '@shared/lib/frame';
import { MS_PER_SECOND } from '@views/player/config/time';
import { formatSeconds } from '@views/player/lib/formatTrack';
import { frameState } from '@views/player/model/store/playback';

export function useElapsedClock() {
  const elapsedRef = useRef<HTMLElement | null>(null);
  const shownSeconds = useRef(-1);

  useFrame(() => {
    const node = elapsedRef.current;
    if (!node) return;
    const seconds = Math.floor((frameState.position * frameState.durationMs) / MS_PER_SECOND);
    if (!Number.isFinite(seconds)) return;
    if (seconds === shownSeconds.current) return;
    shownSeconds.current = seconds;
    node.textContent = formatSeconds(seconds);
  });

  return elapsedRef;
}
