import { createAmbience } from '@features/walk/lib/audio';
import type { Region } from '@shared/world/world';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

type Ambience = ReturnType<typeof createAmbience>;

type Options = { region: Region; isEvening: boolean; onUnavailable: () => void };

export function useAmbience({ region, isEvening, onUnavailable }: Options) {
  const audio = useRef<Ambience | null>(null);
  const [isOn, setIsOn] = useState(false);
  function stop() {
    audio.current?.dispose();
    audio.current = null;
    setIsOn(false);
  }
  const handleVisibility = useEffectEvent(() => {
    if (document.hidden) stop();
  });
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.current?.dispose();
    };
  }, []);
  useEffect(() => {
    audio.current?.setScene(region, isEvening);
  }, [region, isEvening]);
  function toggle() {
    if (audio.current) {
      stop();
      return;
    }
    try {
      audio.current = createAmbience();
      audio.current.setScene(region, isEvening);
      setIsOn(true);
    } catch {
      onUnavailable();
    }
  }
  return { isOn, toggle };
}
