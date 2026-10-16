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
          <path d="M32 54V10M32 32C18 32 14 22 14 16c12 0 18 8 18 16Zm0-9c12 0 16-8 16-14-10 0-16 6-16 14Zm0 19c12 0 18-8 18-14-12 0-18 6-18 14Z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="mb-md text-xs tracking-widest text-prairie-accent">A LITTLE ESCAPE</p>
        <p className="font-display text-6xl font-medium tracking-tight">prairie.</p>
        <p className="mt-lg text-sm text-prairie-paper/70">잠시, 바람을 따라 떠나볼까요.</p>
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
      <p className="absolute bottom-xl text-xs tracking-widest text-prairie-paper/40">
        NO DESTINATION. JUST THE JOURNEY.
      </p>
    </div>
  );
}
