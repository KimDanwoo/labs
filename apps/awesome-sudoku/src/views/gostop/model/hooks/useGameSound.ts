'use client';

import { createAudioContext, playSound } from '@views/gostop/lib/synth';
import type { PlaybackStep } from '@views/gostop/model/types/playback';
import { useEffect, useRef } from 'react';

const UNLOCK_EVENTS = ['pointerdown', 'keydown'] as const;

export const useGameSound = (step: PlaybackStep | null, isMuted: boolean): void => {
  const contextRef = useRef<AudioContext | null>(null);
  const heardStepRef = useRef<PlaybackStep | null>(null);

  useEffect(() => {
    const unlock = () => {
      contextRef.current ??= createAudioContext();
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock));
    };
    UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlock));
    return () => {
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock));
      contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (heardStepRef.current === step) return;
    heardStepRef.current = step;
    const context = contextRef.current;
    const sound = step?.sound;
    if (isMuted) return;
    if (!context) return;
    if (!sound) return;
    playSound(context, sound);
  }, [step, isMuted]);
};
