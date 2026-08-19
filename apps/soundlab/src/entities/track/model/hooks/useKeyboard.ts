'use client';

import { useEffect } from 'react';
import type { Playback } from './usePlayback';

/** 방향키만 10초다. YouTube 원본은 5초이고 10초는 J/L. */
const SEEK_SEC = 10;

export function useKeyboard({ toggle, step, seek, seekBy }: Playback) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // 버튼에 포커스가 있으면 Space는 브라우저가 클릭으로 처리한다. 이중 발동을 막는다.
      const onButton = event.target instanceof HTMLButtonElement;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (event.code === 'Space' || key === 'k') {
        if (onButton && event.code === 'Space') return;
        event.preventDefault();
        toggle();
        return;
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        seekBy(SEEK_SEC);
        return;
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-SEEK_SEC);
        return;
      }
      if (key === 'l') {
        seekBy(10);
      } else if (key === 'j') {
        seekBy(-10);
      } else if (key === 'n' && event.shiftKey) {
        step(1);
      } else if (key === 'p' && event.shiftKey) {
        step(-1);
      } else if (event.code === 'Home') {
        seek(0);
      } else if (event.code === 'End') {
        seek(1);
      } else if (key >= '0' && key <= '9') {
        seek(Number(key) / 10);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seek, seekBy, step, toggle]);
}
