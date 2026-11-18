import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { useFrame } from '@shared/lib/frame';
import { frameState } from '../store/playback';
import { usePlaybackControls } from './usePlaybackControls';

import { ARIA_UPDATE_MS, DRAG_END_EVENTS, PERCENT, PRECISION } from '../../config/scrubber';

export function useScrubber() {
  const { seek } = usePlaybackControls();
  const barRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const sinceAria = useRef(0);
  const shown = useRef({ p: '', glow: '', buffered: '' });

  useFrame((delta) => {
    const node = barRef.current;
    if (!node || dragging.current) return;
    // 변수 하나를 써도 이 서브트리 스타일이 다시 계산된다. 값이 그대로면 건드리지 않는다(정지 중엔 0회).
    const p = frameState.position.toFixed(PRECISION.position);
    const glow = frameState.level.toFixed(PRECISION.level);
    const buffered = frameState.buffered.toFixed(PRECISION.buffered);
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
    if (sinceAria.current >= ARIA_UPDATE_MS) {
      sinceAria.current = 0;
      node.setAttribute('aria-valuenow', String(Math.round(frameState.position * PERCENT)));
    }
  });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      shown.current.p = ratio.toFixed(PRECISION.position);
      barRef.current.style.setProperty('--p', shown.current.p);
      seek(ratio);
    };
    const release = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', move);
    DRAG_END_EVENTS.forEach((type) => window.addEventListener(type, release));
    return () => {
      window.removeEventListener('pointermove', move);
      DRAG_END_EVENTS.forEach((type) => window.removeEventListener(type, release));
    };
  }, [seek]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    const rect = event.currentTarget.getBoundingClientRect();
    seek((event.clientX - rect.left) / rect.width);
  };

  return { barRef, handlePointerDown };
}
