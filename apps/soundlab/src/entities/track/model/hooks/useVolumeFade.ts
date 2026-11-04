import type { ScWidget } from '@entities/track/model/services';
import { useCallback, useEffect, useRef } from 'react';

const FULL_VOLUME = 100;
const FADE_MS = 220;
const FADE_STEP_MS = 20;

export function useVolumeFade() {
  const volume = useRef(FULL_VOLUME);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFade = useCallback(() => {
    if (fade.current !== null) clearInterval(fade.current);
    fade.current = null;
  }, []);

  const rampTo = useCallback(
    (instance: ScWidget, target: number, done?: () => void) => {
      stopFade();
      const from = volume.current;
      if (from === target) {
        done?.();
        return;
      }
      const started = performance.now();
      const handle = setInterval(() => {
        const ratio = Math.min(1, (performance.now() - started) / FADE_MS);
        volume.current = from + (target - from) * ratio;
        instance.setVolume(volume.current);
        if (ratio < 1) return;
        clearInterval(handle);
        if (fade.current === handle) fade.current = null;
        done?.();
      }, FADE_STEP_MS);
      fade.current = handle;
    },
    [stopFade],
  );

  const restoreVolume = useCallback((instance: ScWidget) => rampTo(instance, FULL_VOLUME), [rampTo]);
  const playFaded = useCallback(
    (instance: ScWidget) => {
      instance.play();
      restoreVolume(instance);
    },
    [restoreVolume],
  );
  const pauseFaded = useCallback((instance: ScWidget) => rampTo(instance, 0, () => instance.pause()), [rampTo]);
  const silence = useCallback(
    (instance: ScWidget) => {
      stopFade();
      volume.current = 0;
      instance.setVolume(0);
    },
    [stopFade],
  );
  useEffect(() => stopFade, [stopFade]);

  return { playFaded, pauseFaded, restoreVolume, silence, stopFade };
}
