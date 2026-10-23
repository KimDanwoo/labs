import { createAmbience } from '@features/walk/lib/audio';
import { TIME, type TimeOfDay } from '@features/walk/model/constants';
import type { Region } from '@shared/world/world';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

type Ambience = ReturnType<typeof createAmbience>;
type Scene = { region: Region; time: TimeOfDay };

/** The nature sound switch; scene and footsteps can be wired before the walk engine exists. */
export function useAmbience(onUnavailable: () => void) {
  const audio = useRef<Ambience | null>(null);
  const scene = useRef<Scene>({ region: 'village', time: TIME.day });
  const [isOn, setIsOn] = useState(false);
  const [sound] = useState(() => ({
    step: (...args: Parameters<Ambience['step']>) => audio.current?.step(...args),
    cue: (...args: Parameters<Ambience['cue']>) => audio.current?.cue(...args),
    setScene(next: Scene) {
      scene.current = next;
      audio.current?.setScene(next.region, next.time);
    },
  }));
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
      audio.current.setScene(scene.current.region, scene.current.time);
      setIsOn(true);
    } catch {
      onUnavailable();
    }
  }
  return { isOn, toggle, ...sound };
}

/** Keeps the soundscape on the painting and time of day in view. */
export function useAmbienceScene(setScene: (scene: Scene) => void, region: Region, time: TimeOfDay) {
  useEffect(() => {
    setScene({ region, time });
  }, [setScene, region, time]);
}
