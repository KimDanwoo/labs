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
  const shown = useRef({ p: '', glow: '', buffered: '' });

  useFrame((delta) => {
    const node = bar.current;
    if (!node || dragging.current) return;
    // 변수 하나를 써도 이 서브트리 스타일이 다시 계산된다. 값이 그대로면 건드리지 않는다(정지 중엔 0회).
    const p = frameState.position.toFixed(5);
    const glow = frameState.level.toFixed(3);
    const buffered = frameState.buffered.toFixed(3);
    if (p !== shown.current.p) {
      shown.current.p = p;
      node.style.setProperty('--p', p);
    }
    if (glow !== shown.current.glow) {
      shown.current.glow = glow;
      node.style.setProperty('--glow', glow);
    }
    if (buffered !== shown.current.buffered) {
      shown.current.buffered = buffered;
      node.style.setProperty('--b', buffered);
    }

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
      shown.current.p = ratio.toFixed(5);
      bar.current.style.setProperty('--p', shown.current.p);
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
      // container-type: 손잡이를 100cqw로 옮긴다 — % translate는 자기 크기(7px) 기준이라 못 쓴다.
      style={{ containerType: 'inline-size' }}
      className="relative flex h-[14px] cursor-pointer touch-none items-center"
      onPointerDown={(event) => {
        dragging.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        seek((event.clientX - rect.left) / rect.width);
      }}
    >
      <span aria-hidden className="bg-hairline absolute inset-x-0 h-[2px]" />
      {/* 버퍼된 구간. 다 차면 스스로 사라진다 — 정보가 없는 동안 화면에 선을 하나 더 남기지 않는다. */}
      <span
        aria-hidden
        className="bg-mute absolute inset-x-0 h-[2px] origin-left"
        style={{ transform: 'scaleX(var(--b, 0))', opacity: 'calc(1 - var(--b, 0))' }}
      />
      {/* width·left로 움직이면 매 프레임 레이아웃이 돈다. 변형은 합성 단계에서만 처리된다. */}
      <span
        aria-hidden
        className="bg-paper absolute inset-x-0 h-[2px] origin-left"
        style={{ transform: 'scaleX(var(--p, 0))' }}
      />
      <span
        aria-hidden
        className="bg-paper absolute left-0 size-[7px] rounded-full"
        style={{
          transform: 'translateX(calc(var(--p, 0) * 100cqw - 50%))',
          boxShadow: '0 0 calc(3px + var(--glow, 0) * 14px) rgb(255 255 255 / calc(0.2 + var(--glow, 0) * 0.6))',
        }}
      />
    </div>
  );
}
