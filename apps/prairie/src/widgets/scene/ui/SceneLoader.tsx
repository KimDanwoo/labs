'use client';

import { useProgress } from '@react-three/drei';
import { SCENE_COLORS } from '@shared/config';
import { useEffect, useState } from 'react';

const FADE_MS = 500;

// 에셋(그래스·말 glb, 큐브맵 6장) 로드 동안 빈 화면 대신 띄우는 브랜드 스플래시.
// drei useProgress는 Canvas 밖 DOM 트리에서도 전역 로딩 매니저를 구독한다.
export function SceneLoader() {
  const { active, progress } = useProgress();
  const [removed, setRemoved] = useState(false);
  const done = !active && progress >= 100;

  useEffect(() => {
    if (!done) return undefined;
    const id = setTimeout(() => setRemoved(true), FADE_MS);
    return () => clearTimeout(id);
  }, [done]);

  if (removed) return null;

  return (
    <div
      aria-hidden={done}
      className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3xl transition-opacity duration-500"
      style={{
        opacity: done ? 0 : 1,
        background: `linear-gradient(to bottom, ${SCENE_COLORS.skyTop}, ${SCENE_COLORS.skyBottom} 55%, ${SCENE_COLORS.grass})`,
      }}
    >
      <span className="animate-bounce text-7xl drop-shadow-lg" role="img" aria-label="달리는 말">
        🐎
      </span>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/35">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm font-medium text-white drop-shadow">초원을 준비하는 중… {Math.round(progress)}%</p>
    </div>
  );
}
