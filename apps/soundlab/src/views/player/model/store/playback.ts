import { type PlayerScreen, PLAYER_SCREEN } from '@entities/track';
import { type RepeatMode, REPEAT_MODE } from '@views/player/model/constants/repeatMode';
import type { PlaybackQueue } from '@views/player/model/queue';
import { atom } from 'jotai/vanilla';

export const playbackQueueAtom = atom<PlaybackQueue | null>(null);
export const recoveryNoticeAtom = atom(false);
export const resumeNoticeAtom = atom<number | null>(null);

export const currentIndexAtom = atom(0);
export const isPlayingAtom = atom(false);
export const isReadyAtom = atom(false);
export const shuffleAtom = atom(false);
export const repeatModeAtom = atom<RepeatMode>(REPEAT_MODE.off);

export const engineErrorAtom = atom<string | null>(null);

export const playerScreenAtom = atom<PlayerScreen>(PLAYER_SCREEN.nowPlaying);

export const engineModeAtom = atom<'set' | 'single' | 'unknown'>('unknown');

export const frameState = {
  position: 0,
  level: 0,
  swell: 0,
  bass: 0,
  air: 0,
  beatId: 0,
  beatStrength: 0,
  pre: 0,
  hit: 0,
  buffered: 0,
  durationMs: 0,
};

export const writeBuffered = (loaded: number | undefined) => {
  const isFiniteLoaded = typeof loaded === 'number' && Number.isFinite(loaded);
  if (isFiniteLoaded) frameState.buffered = Math.min(1, Math.max(0, loaded));
};
