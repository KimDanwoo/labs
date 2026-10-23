import { createScene, type SceneStatus, type WalkEngine } from '@features/walk/lib/scene';
import { SPAWN } from '@shared/world/world';
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';

type EngineSettings = { isEvening: boolean; isSprinting: boolean };

const INITIAL_STATUS: SceneStatus = { ...SPAWN, region: 'village', walking: false, nearby: null, steps: 0 };
const LOAD_ERROR = '풍경을 불러오지 못했어요. 페이지를 새로고침하거나 브라우저의 하드웨어 가속 설정을 확인해 주세요.';

/** Owns the Three.js engine lifecycle and keeps it in step with the HUD settings. */
export function useWalkEngine(containerRef: RefObject<HTMLDivElement | null>, settings: EngineSettings) {
  const engine = useRef<WalkEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SceneStatus>(INITIAL_STATUS);
  const [hasWalked, setHasWalked] = useState(false);
  const applySettings = useEffectEvent((instance: WalkEngine) => {
    instance.setEvening(settings.isEvening);
    instance.setInput('shift', settings.isSprinting);
  });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let isCancelled = false;
    const controller = new AbortController();
    const handleStatus = (next: SceneStatus) => {
      setStatus(next);
      if (next.walking) setHasWalked(true);
    };
    createScene(container, handleStatus, controller.signal)
      .then((instance) => {
        if (isCancelled) {
          instance.dispose();
          return;
        }
        engine.current = instance;
        applySettings(instance);
        setIsReady(true);
      })
      .catch(() => {
        if (!isCancelled) setError(LOAD_ERROR);
      });
    return () => {
      isCancelled = true;
      controller.abort();
      engine.current?.dispose();
      engine.current = null;
    };
  }, [containerRef]);
  useEffect(() => {
    engine.current?.setEvening(settings.isEvening);
  }, [settings.isEvening]);
  useEffect(() => {
    engine.current?.setInput('shift', settings.isSprinting);
  }, [settings.isSprinting]);
  return { engine, isReady, error, status, hasWalked };
}
