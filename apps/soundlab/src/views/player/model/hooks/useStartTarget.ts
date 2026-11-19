'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { RESUME_TAIL_MS } from '../../config/playback';
import { readStartTarget } from '../lastPlayed';
import { currentIndexAtom, frameState, resumeNoticeAtom } from '../store/playback';
import type { PlaybackEngine } from './useEngineRefs';

export function useStartTarget({ tracks, refs, clock }: PlaybackEngine, initialTrackId?: number) {
  const { resumeRef } = refs;
  const { anchor } = clock;
  const setIndex = useSetAtom(currentIndexAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);

  // 소리를 자동으로 내지는 않는다 — 브라우저가 제스처 없는 재생을 막는다. 첫 재생 조작에서 이어진다.
  useEffect(() => {
    const target = readStartTarget(initialTrackId);
    const at = target ? tracks.findIndex((track) => track.id === target.id) : -1;
    const track = tracks[at];
    if (!target || !track || track.isAvailable === false) return;
    setIndex(at);
    if (track.durationMs - target.ms < RESUME_TAIL_MS) return;
    resumeRef.current = { index: at, ms: target.ms };
    setResumeNotice(target.ms);
    frameState.durationMs = track.durationMs;
    anchor(target.ms);
  }, [anchor, initialTrackId, resumeRef, setIndex, setResumeNotice, tracks]);
}
