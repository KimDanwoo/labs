'use client';

import { createAudioContext } from '@views/gostop/lib/synth';
import { useEffect, useRef, type RefObject } from 'react';

const UNLOCK_EVENTS = ['pointerdown', 'keydown'] as const;

export const useAudioContext = (): RefObject<AudioContext | null> => {
  const contextRef = useRef<AudioContext | null>(null);

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

  return contextRef;
};
