'use client';

import { artworkUrl } from '@entities/track/model/services';
import { frameState } from '@entities/track/model/store';
import type { ArtworkSize, Track } from '@entities/track/model/types';
import { useFrame } from '@shared/lib/frame';
import { useEffect, useRef } from 'react';
import type { Playback } from './usePlayback';

/**
 * 잠금화면·OS 미디어키·이어폰 버튼에 이 플레이어를 연결한다.
 *
 * 소리는 사운드클라우드 위젯 iframe이 낸다. 그 iframe도 자기 metadata를 세팅하므로
 * 마지막에 쓴 쪽이 이긴다 — 곡이 바뀔 때와 재생/정지가 바뀔 때 다시 써서 되찾는다.
 * 그 이상은 top 프레임에서 강제할 수단이 없다(실기기에서 확인 필요).
 */

/** 잠금화면 진행바 갱신 주기. OS가 playbackRate로 사이를 메우므로 매 프레임 보낼 이유가 없다. */
const POSITION_INTERVAL_MS = 1000;
/** 액션에 오프셋이 안 실려 오면 쓰는 기본값. 키보드 J/L과 같게 맞춘다. */
const SEEK_SEC = 10;

const ARTWORK_SIZES: readonly ArtworkSize[] = ['t200x200', 't300x300', 't500x500'];

const hasSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

/** 브라우저가 모르는 액션은 예외를 던진다 — 나머지 손잡이까지 잃지 않게 하나씩 감싼다. */
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
    if (!hasSession() || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: 'Danwoo',
      album: 'soundlab',
      artwork: ARTWORK_SIZES.map((size) => ({
        src: artworkUrl(track, size),
        // t500x500 → 500x500
        sizes: size.slice(1),
        type: track.artworkExt === '.png' ? 'image/png' : 'image/jpeg',
      })),
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, track]);

  useEffect(() => {
    if (!hasSession()) return undefined;
    // toggle은 상태를 스스로 보고 뒤집는다. OS가 이미 맞는 상태에서 play/pause를 보내면 거꾸로 가므로 막는다.
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
          if (seekTime === undefined || frameState.durationMs <= 0) return;
          seek((seekTime * 1000) / frameState.durationMs);
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

    const duration = frameState.durationMs / 1000;
    // 음수·NaN이거나 position이 duration을 넘으면 setPositionState가 던진다. 공유 rAF 루프가 거기서 끊긴다.
    if (!Number.isFinite(duration) || duration <= 0) return;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(duration, Math.max(0, frameState.position * duration)),
    });
  });
}
