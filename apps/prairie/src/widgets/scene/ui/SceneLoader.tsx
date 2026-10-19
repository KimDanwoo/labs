'use client';

import { useProgress } from '@react-three/drei';
import { useSceneReady } from '@shared/r3f';
import { useEffect, useState } from 'react';

const FADE_MS = 700;

export function SceneLoader() {
  const { progress } = useProgress();
  const ready = useSceneReady();
  const [isRemoved, setIsRemoved] = useState(false);
  const percent = ready ? 100 : Math.min(99, Math.round(progress));

  useEffect(() => {
    if (!ready) return undefined;
    const id = setTimeout(() => setIsRemoved(true), FADE_MS);
    return () => clearTimeout(id);
  }, [ready]);

  if (isRemoved) return null;

  return (
    <div
      aria-hidden={ready}
      className="prairie-loader pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2xl bg-prairie-ink text-prairie-paper transition-opacity duration-700 motion-reduce:transition-none"
      style={{ opacity: ready ? 0 : 1 }}
    >
      <div
        aria-hidden
        className="prairie-loader-orbit flex size-32 items-center justify-center rounded-full border border-prairie-paper/20"
      >
        <svg
          viewBox="0 0 64 64"
          className="size-16 text-prairie-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M32 8 38 24 54 30 38 36 32 52 26 36 10 30 26 24ZM10 52c12 4 31-4 44-20" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-4xl font-medium tracking-tight sm:text-6xl">unicorn rush.</p>
      </div>
      <div className="w-56">
        <div
          role="progressbar"
          aria-label="초원 준비 중"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-px overflow-hidden bg-prairie-paper/20"
        >
          <div className="h-full bg-prairie-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-md flex justify-between font-mono text-xs text-prairie-paper/60">
          <span>초원을 준비하는 중</span>
          <span>{percent}%</span>
        </p>
      </div>
    </div>
  );
}
