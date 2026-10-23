import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createAmbience } from '@features/walk/lib/audio';

type Ambience = ReturnType<typeof createAmbience>;

export function useAmbience(onUnavailable: () => void) {
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
  function toggle() {
    if (audio.current) {
      stop();
      return;
    }
    try {
      audio.current = createAmbience();
      setIsOn(true);
    } catch {
      onUnavailable();
    }
  }
  return { isOn, toggle };
}
