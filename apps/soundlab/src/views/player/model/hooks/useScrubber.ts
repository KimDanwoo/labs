import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { useFrame } from '@shared/lib/frame';
import { usePlaybackControls } from '@views/player/model/hooks/usePlaybackControls';
import { frameState } from '@views/player/model/store/playback';

import { ARIA_UPDATE_MS, DRAG_END_EVENTS, KEY_SEEK_SEC, PERCENT, PRECISION } from '@views/player/config/scrubber';

export function useScrubber() {
  const { seek, seekBy } = usePlaybackControls();
  const barRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const sinceAria = useRef(0);
  const shown = useRef({ p: '', glow: '', buffered: '' });

  useFrame((delta) => {
    const node = barRef.current;
    if (!node) return;
    if (dragging.current) return;
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

    sinceAria.current += delta;
    if (sinceAria.current >= ARIA_UPDATE_MS) {
      sinceAria.current = 0;
      node.setAttribute('aria-valuenow', String(Math.round(frameState.position * PERCENT)));
    }
  });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      if (!barRef.current) return;
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

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keyActions: Record<string, () => void> = {
      ArrowRight: () => seekBy(KEY_SEEK_SEC),
      ArrowUp: () => seekBy(KEY_SEEK_SEC),
      ArrowLeft: () => seekBy(-KEY_SEEK_SEC),
      ArrowDown: () => seekBy(-KEY_SEEK_SEC),
      Home: () => seek(0),
      End: () => seek(1),
    };
    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  return { barRef, handlePointerDown, handleMouseDown, handleKeyDown };
}
