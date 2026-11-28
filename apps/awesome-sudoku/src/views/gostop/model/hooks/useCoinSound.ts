'use client';

import { playSound } from '@views/gostop/lib/synth';
import { useEffect, useRef, type RefObject } from 'react';

export const useCoinSound = (
  cue: string | null,
  isMuted: boolean,
  contextRef: RefObject<AudioContext | null>,
): void => {
  const heardCueRef = useRef<string | null>(null);

  useEffect(() => {
    if (heardCueRef.current === cue) return;
    heardCueRef.current = cue;
    const context = contextRef.current;
    if (isMuted) return;
    if (!context) return;
    if (!cue) return;
    playSound(context, 'coins');
  }, [cue, isMuted, contextRef]);
};
