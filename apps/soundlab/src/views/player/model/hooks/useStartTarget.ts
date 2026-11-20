'use client';

import { RESUME_TAIL_MS } from '@views/player/config/playback';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { readStartTarget } from '@views/player/model/lastPlayed';
import { currentIndexAtom, frameState, resumeNoticeAtom } from '@views/player/model/store/playback';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

export function useStartTarget({ tracks, refs, clock }: PlaybackEngine, initialTrackId?: number) {
  const { resumeRef } = refs;
  const { anchor } = clock;
  const setIndex = useSetAtom(currentIndexAtom);
  const setResumeNotice = useSetAtom(resumeNoticeAtom);

  useEffect(() => {
    const target = readStartTarget(initialTrackId);
    const at = target ? tracks.findIndex((track) => track.id === target.id) : -1;
    const track = tracks[at];
    if (!target) return;
    if (!track) return;
    if (track.isAvailable === false) return;
    setIndex(at);
    if (track.durationMs - target.ms < RESUME_TAIL_MS) return;
    resumeRef.current = { index: at, ms: target.ms };
    setResumeNotice(target.ms);
    frameState.durationMs = track.durationMs;
    anchor(target.ms);
  }, [anchor, initialTrackId, resumeRef, setIndex, setResumeNotice, tracks]);
}
