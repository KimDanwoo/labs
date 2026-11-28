'use client';

import { playSound } from '@views/gostop/lib/synth';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import { useEffect, useRef, type RefObject } from 'react';

export const useGameSound = (
  step: PlaybackStep | null,
  isMuted: boolean,
  contextRef: RefObject<AudioContext | null>,
): void => {
  const heardStepRef = useRef<PlaybackStep | null>(null);

  useEffect(() => {
    if (heardStepRef.current === step) return;
    heardStepRef.current = step;
    const context = contextRef.current;
    const sound = step?.sound;
    if (isMuted) return;
    if (!context) return;
    if (!sound) return;
    playSound(context, sound);
  }, [step, isMuted, contextRef]);
};
