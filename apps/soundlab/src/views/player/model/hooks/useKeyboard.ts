'use client';

import type { Playback } from '@views/player/model/hooks/usePlayback';
import { useEffect } from 'react';

const SEEK_SEC = 10;
const DIGIT_SEEK_DIVISOR = 10;
const IGNORED_TARGET_SELECTOR = 'input, textarea, select, [role=slider], [role=menu]';
const DIGIT_PATTERN = /^[0-9]$/;

function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey || event.isComposing;
}

function isIgnoredTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && (target.isContentEditable || target.closest(IGNORED_TARGET_SELECTOR) !== null)
  );
}

function normalizeKey(event: KeyboardEvent): string {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

export function useKeyboard({ toggle, step, seek, seekBy }: Playback) {
  useEffect(() => {
    const runShortcut = (event: KeyboardEvent, key: string): void => {
      const seekActions: Record<string, () => void> = {
        ArrowRight: () => seekBy(SEEK_SEC),
        ArrowLeft: () => seekBy(-SEEK_SEC),
        Home: () => seek(0),
        End: () => seek(1),
      };
      const keyActions: Record<string, () => void> = {
        l: () => seekBy(SEEK_SEC),
        j: () => seekBy(-SEEK_SEC),
      };
      const shiftKeyActions: Record<string, () => void> = {
        n: () => step(1),
        p: () => step(-1),
      };

      const codeAction = seekActions[event.code];
      if (codeAction) {
        if (event.code.startsWith('Arrow')) event.preventDefault();
        codeAction();
        return;
      }
      const action = keyActions[key] ?? (event.shiftKey ? shiftKeyActions[key] : undefined);
      if (action) {
        action();
        return;
      }
      if (DIGIT_PATTERN.test(key)) seek(Number(key) / DIGIT_SEEK_DIVISOR);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (hasModifier(event)) return;
      if (isIgnoredTarget(event.target)) return;
      const key = normalizeKey(event);

      const isPlayPauseKey = event.code === 'Space' || key === 'k';
      if (isPlayPauseKey) {
        const isButtonSpace = event.target instanceof HTMLButtonElement && event.code === 'Space';
        if (isButtonSpace) return;
        event.preventDefault();
        toggle();
        return;
      }
      runShortcut(event, key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [seek, seekBy, step, toggle]);
}
