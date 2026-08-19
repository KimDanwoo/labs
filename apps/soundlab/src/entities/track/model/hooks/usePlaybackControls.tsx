'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Playback } from './usePlayback';

/**
 * usePlayback은 iframe 엔진을 소유하므로 인스턴스가 하나여야 한다.
 * 목록·transport·단축키가 콜백 prop 없이 직접 구독하도록 context로 나눠준다.
 */
const PlaybackContext = createContext<Playback | null>(null);

export function PlaybackProvider({ value, children }: { value: Playback; children: ReactNode }) {
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlaybackControls(): Playback {
  const controls = useContext(PlaybackContext);
  if (!controls) throw new Error('PlaybackProvider 안에서만 사용할 수 있습니다');
  return controls;
}
