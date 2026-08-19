'use client';

import { useFrame } from '@shared/lib/frame';
import { useRef } from 'react';
import { frameState } from '../model/store';

/** 현재 곡 행에만 붙는 3바 미터. 파형 진폭을 CSS 변수로 흘려 리렌더 없이 움직인다. */
export function LevelMeter() {
  const root = useRef<HTMLSpanElement | null>(null);

  useFrame(() => {
    root.current?.style.setProperty('--lv', frameState.level.toFixed(3));
  });

  return (
    <span ref={root} aria-hidden className="flex h-[11px] shrink-0 items-end gap-2xs">
      <i className="bg-brass w-2xs h-[calc(4px+var(--lv,0)*7px)]" />
      <i className="bg-brass w-2xs h-[calc(7px+var(--lv,0)*4px)]" />
      <i className="bg-brass w-2xs h-[calc(5px+var(--lv,0)*6px)]" />
    </span>
  );
}
