import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createAmbience } from '../../lib/audio';
import { TIME, WEATHER, type TimeOfDay, type Weather } from '../constants/walk';
import type { Region } from '../world/world';

type Ambience = ReturnType<typeof createAmbience>;
type Scene = { region: Region; time: TimeOfDay; weather: Weather };

export function useAmbience(onUnavailable: () => void) {
  const audio = useRef<Ambience | null>(null);
  const scene = useRef<Scene>({ region: 'village', time: TIME.day, weather: WEATHER.clear });
  const [isOn, setIsOn] = useState(false);
  const [sound] = useState(() => ({
    step: (...args: Parameters<Ambience['step']>) => audio.current?.step(...args),
    fishingCue: (...args: Parameters<Ambience['fishingCue']>) => audio.current?.fishingCue(...args),
    cue: (...args: Parameters<Ambience['cue']>) => audio.current?.cue(...args),
    setScene(next: Scene) {
      scene.current = next;
      audio.current?.setScene(next.region, next.time, next.weather);
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
      audio.current.setScene(scene.current.region, scene.current.time, scene.current.weather);
      setIsOn(true);
    } catch {
      onUnavailable();
    }
  }
  return { isOn, toggle, ...sound };
}

export function useAmbienceScene(setScene: (scene: Scene) => void, { region, time, weather }: Scene) {
  useEffect(() => {
    setScene({ region, time, weather });
  }, [setScene, region, time, weather]);
}
