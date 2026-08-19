'use client';

import { usePlaybackControls } from '@entities/track/model/hooks/usePlaybackControls';
import { frameState } from '@entities/track/model/store';
import { useFrame } from '@shared/lib/frame';
import { useEffect, useRef } from 'react';

export function Scrubber() {
  const { seek } = usePlaybackControls();
  const bar = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const sinceAria = useRef(0);

  useFrame((delta) => {
    const node = bar.current;
    if (!node || dragging.current) return;
    node.style.setProperty('--p', frameState.position.toFixed(5));
    node.style.setProperty('--glow', frameState.level.toFixed(3));

    // 보조기술에 60fps로 값을 흘리지 않는다.
    sinceAria.current += delta;
    if (sinceAria.current >= 250) {
      sinceAria.current = 0;
      node.setAttribute('aria-valuenow', String(Math.round(frameState.position * 100)));
    }
  });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !bar.current) return;
      const rect = bar.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      bar.current.style.setProperty('--p', ratio.toFixed(5));
      seek(ratio);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [seek]);

  return (
    <div
      ref={bar}
      role="slider"
      aria-label="재생 위치"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={-1}
      className="relative flex h-[14px] cursor-pointer touch-none items-center"
      onPointerDown={(event) => {
        dragging.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        seek((event.clientX - rect.left) / rect.width);
      }}
    >
      <span aria-hidden className="bg-hairline absolute inset-x-0 h-[2px]" />
      <span aria-hidden className="bg-paper absolute left-0 h-[2px] w-[calc(var(--p,0)*100%)]" />
      <span
        aria-hidden
        className="bg-paper absolute size-[7px] -translate-x-1/2 rounded-full left-[calc(var(--p,0)*100%)]"
        style={{
          boxShadow: '0 0 calc(3px + var(--glow, 0) * 14px) rgb(255 255 255 / calc(0.2 + var(--glow, 0) * 0.6))',
        }}
      />
    </div>
  );
}
