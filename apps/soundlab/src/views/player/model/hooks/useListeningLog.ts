'use client';

import { useSetAtom } from 'jotai';
import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { LISTEN_STEP_LIMIT_MS, SAVE_INTERVAL_MS } from '../../config/playback';
import { LISTEN_SOURCE, recordListeningAtom, recordSessionAtom, SESSION_EVENT } from '../library';
import type { PlaybackQueue } from '../queue';

const SESSION_EVENT_LIMIT = 2;

export function useListeningLog(queue: RefObject<PlaybackQueue | null>) {
  const recordListening = useSetAtom(recordListeningAtom);
  const recordSession = useSetAtom(recordSessionAtom);
  const sessionTracks = useRef(new Set<number>());
  const openedAt = useRef(0);
  const listening = useRef({ id: 0, ms: 0, position: 0, at: 0 });

  useEffect(() => {
    openedAt.current = performance.now();
  }, []);

  const flush = useCallback(() => {
    const pending = listening.current;
    if (pending.ms > 0)
      recordListening({
        id: pending.id,
        elapsedMs: pending.ms,
        source: queue.current ? LISTEN_SOURCE.collection : LISTEN_SOURCE.all,
      });
    pending.ms = 0;
  }, [queue, recordListening]);

  const restart = useCallback((id: number) => {
    listening.current = { id, ms: 0, position: 0, at: 0 };
  }, []);

  const track = useCallback(
    (currentId: number, position: number, isPlaying: boolean) => {
      const pending = listening.current;
      const now = performance.now();
      if (isPlaying && currentId > 0 && position > 0 && !sessionTracks.current.has(currentId)) {
        if (sessionTracks.current.size < SESSION_EVENT_LIMIT)
          recordSession({
            kind: sessionTracks.current.size === 0 ? SESSION_EVENT.firstPlay : SESSION_EVENT.continued,
            waitMs: now - openedAt.current,
          });
        sessionTracks.current.add(currentId);
      }
      const elapsed = position - pending.position;
      const wall = now - pending.at;
      const isPlausibleStep = elapsed > 0 && elapsed < LISTEN_STEP_LIMIT_MS && wall > 0 && wall < LISTEN_STEP_LIMIT_MS;
      if (pending.id === currentId && isPlausibleStep) pending.ms += Math.min(elapsed, wall);
      pending.id = currentId;
      pending.position = position;
      pending.at = now;
      if (pending.ms >= SAVE_INTERVAL_MS) flush();
    },
    [flush, recordSession],
  );

  return { flush, restart, track };
}
