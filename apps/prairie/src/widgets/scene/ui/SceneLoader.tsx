'use client';

import { useProgress } from '@react-three/drei';
import { SCENE_COLORS } from '@shared/config';
import { useSceneReady } from '@shared/r3f';
import { useEffect, useState } from 'react';

const FADE_MS = 500;

// 에셋 로드 진행률은 useProgress, "실제 첫 프레임이 그려졌는지"는 useSceneReady로 판단한다.
// 둘을 합쳐 빈 화면(JS 다운로드)→로딩→첫 프레임까지 끊김 없이 덮는다.
export function SceneLoader() {
  const { progress } = useProgress();
  const ready = useSceneReady();
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!ready) return undefined;
    const id = setTimeout(() => setRemoved(true), FADE_MS);
    return () => clearTimeout(id);
  }, [ready]);

  if (removed) return null;

  return (
    <div
      aria-hidden={ready}
      className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3xl transition-opacity duration-500"
      style={{
        opacity: ready ? 0 : 1,
        background: `linear-gradient(to bottom, ${SCENE_COLORS.skyTop}, ${SCENE_COLORS.skyBottom} 55%, ${SCENE_COLORS.grass})`,
      }}
    >
      <div className="flex items-end gap-2">
        <span className="animate-bounce text-7xl drop-shadow-lg" role="img" aria-label="달리는 말">
          🐎
        </span>
        <span className="animate-pulse pb-2 text-3xl opacity-80" aria-hidden>
          💨
        </span>
      </div>

      <div className="flex flex-col items-center gap-sm">
        <div className="h-2.5 w-56 overflow-hidden rounded-full bg-white/40 shadow-inner">
          <div
            className="h-full rounded-full bg-white shadow-glow transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-semibold text-white drop-shadow">초원을 달릴 준비 중… {Math.round(progress)}%</p>
      </div>

      <div className="absolute bottom-10 flex items-end gap-3 text-2xl opacity-80" aria-hidden>
        <span className="animate-pulse">🌱</span>
        <span className="animate-bounce text-3xl">🌾</span>
        <span className="animate-pulse">🌿</span>
      </div>
    </div>
  );
}
