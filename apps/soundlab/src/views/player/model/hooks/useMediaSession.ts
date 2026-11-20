'use client';

import { artworkUrl, type ArtworkSize, type Track } from '@entities/track';
import { useFrame } from '@shared/lib/frame';
import { MS_PER_SECOND } from '@views/player/config/time';
import type { Playback } from '@views/player/model/hooks/usePlayback';
import { frameState } from '@views/player/model/store/playback';
import { useEffect, useRef } from 'react';

const POSITION_INTERVAL_MS = 1000;
const SEEK_SEC = 10;

const ARTWORK_SIZES: readonly ArtworkSize[] = ['t200x200', 't300x300', 't500x500'];

const hasSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

function bind(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    return;
  }
}

export function useMediaSession(track: Track | undefined, isPlaying: boolean, playback: Playback) {
  const { toggle, step, seek, seekBy } = playback;
  const sincePosition = useRef(POSITION_INTERVAL_MS);

  useEffect(() => {
    if (!hasSession()) return;
    if (!track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'Danwoo',
      album: 'soundlab',
      artwork: ARTWORK_SIZES.map((size) => ({
        src: artworkUrl(track, size),
        sizes: size.slice(1),
        type: track.artworkExt === '.png' ? 'image/png' : 'image/jpeg',
      })),
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, track]);

  useEffect(() => {
    if (!hasSession()) return undefined;
    const actions: readonly (readonly [MediaSessionAction, MediaSessionActionHandler])[] = [
      ['play', () => (isPlaying ? undefined : toggle())],
      ['pause', () => (isPlaying ? toggle() : undefined)],
      ['previoustrack', () => step(-1)],
      ['nexttrack', () => step(1)],
      ['seekbackward', ({ seekOffset }) => seekBy(-(seekOffset ?? SEEK_SEC))],
      ['seekforward', ({ seekOffset }) => seekBy(seekOffset ?? SEEK_SEC)],
      [
        'seekto',
        ({ seekTime }) => {
          if (seekTime === undefined) return;
          if (frameState.durationMs <= 0) return;
          seek((seekTime * MS_PER_SECOND) / frameState.durationMs);
        },
      ],
    ];

    for (const [action, handler] of actions) bind(action, handler);
    return () => {
      for (const [action] of actions) bind(action, null);
    };
  }, [isPlaying, seek, seekBy, step, toggle]);

  useFrame((delta) => {
    if (!hasSession()) return;
    sincePosition.current += delta;
    if (sincePosition.current < POSITION_INTERVAL_MS) return;
    sincePosition.current = 0;

    const duration = frameState.durationMs / MS_PER_SECOND;
    if (!Number.isFinite(duration)) return;
    if (duration <= 0) return;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(duration, Math.max(0, frameState.position * duration)),
    });
  });
}
