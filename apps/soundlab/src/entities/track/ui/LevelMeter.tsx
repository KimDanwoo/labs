'use client';

import { useFrame } from '@shared/lib/frame';
import { useRef } from 'react';
import { frameState } from '../model/store';

/**
 * 현재 곡 행에만 붙는 3바 미터. 파형 진폭을 CSS 변수로 흘려 리렌더 없이 움직인다.
 * 높이(11px) 대비 배율로 늘린다 — height를 건드리면 매 프레임 이 행의 레이아웃이 다시 돈다.
 */
const BAR = 'bg-brass w-2xs h-[11px] origin-bottom';
const SCALE = [
  'scaleY(calc(0.364 + var(--lv, 0) * 0.636))',
  'scaleY(calc(0.636 + var(--lv, 0) * 0.364))',
  'scaleY(calc(0.455 + var(--lv, 0) * 0.545))',
];

export function LevelMeter() {
  const root = useRef<HTMLSpanElement | null>(null);
  const shown = useRef('');

  useFrame(() => {
    const level = frameState.level.toFixed(3);
    if (level === shown.current) return;
    shown.current = level;
    root.current?.style.setProperty('--lv', level);
  });

  return (
    <span ref={root} aria-hidden className="flex h-[11px] shrink-0 items-end gap-2xs">
      {SCALE.map((transform) => (
        <i key={transform} className={BAR} style={{ transform }} />
      ))}
    </span>
  );
}
