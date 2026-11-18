import { useRef } from 'react';

import { useFrame } from '@shared/lib/frame';

import { LEVEL_PRECISION } from '../../config/display';
import { frameState } from '../store/playback';

export function useLevelMeter() {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const shown = useRef('');

  useFrame(() => {
    const level = frameState.level.toFixed(LEVEL_PRECISION);
    if (level === shown.current) return;
    shown.current = level;
    rootRef.current?.style.setProperty('--lv', level);
  });

  return rootRef;
}
