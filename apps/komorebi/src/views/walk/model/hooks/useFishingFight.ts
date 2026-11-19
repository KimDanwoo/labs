import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { FIGHT_TICK_MS, REEL_KEY, REEL_KEYS, VIBRATION } from '../../config/fishing';
import { MS_PER_SECOND } from '../../config/time';
import { FIGHT_OUTCOME, fishSurge, startFight, stepFight, type Fight } from '../../lib/fishFight';
import { FISHING_PHASE, type Catch, type FishingFrame } from '../../lib/fishing';

interface FishingFightInput {
  fish: Catch;
  isPerfect: boolean;
  onFinish: (outcome: Fight['outcome']) => void;
  onFrame: (frame: FishingFrame) => void;
}

export function useFishingFight({ fish, isPerfect, onFinish, onFrame }: FishingFightInput) {
  const [fight, setFight] = useState(() => startFight(isPerfect));
  const current = useRef(fight);
  const keys = useRef(new Set<string>());
  const pointer = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const finish = useEffectEvent(onFinish);
  const publish = useEffectEvent(onFrame);
  useEffect(() => {
    buttonRef.current?.focus();
    let previous = performance.now();
    const release = () => {
      keys.current.clear();
      pointer.current = null;
    };
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - previous) / MS_PER_SECOND;
      previous = now;
      if (document.hidden) return;
      const isHolding = keys.current.size > 0 || pointer.current !== null;
      const next = stepFight(current.current, isHolding, dt, fish.size, fish.id);
      current.current = next;
      setFight(next);
      publish({
        phase: FISHING_PHASE.fighting,
        elapsed: next.elapsed,
        tension: next.tension,
        progress: next.progress,
        isReeling: isHolding,
        isSurging: fishSurge(fish.id, next.elapsed),
      });
      if (next.outcome !== FIGHT_OUTCOME.active) {
        window.clearInterval(timer);
        navigator.vibrate?.(next.outcome === FIGHT_OUTCOME.landed ? [...VIBRATION.landed] : VIBRATION.lost);
        finish(next.outcome);
      }
    }, FIGHT_TICK_MS);
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.code !== REEL_KEY) return;
      event.preventDefault();
      keys.current.add(event.code);
    };
    const keyup = (event: globalThis.KeyboardEvent) => {
      keys.current.delete(event.code);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, [fish.id, fish.size]);

  function releasePointer(event: PointerEvent<HTMLButtonElement>) {
    if (pointer.current === event.pointerId) pointer.current = null;
  }

  const reelHandlers = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || pointer.current !== null) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.current = event.pointerId;
    },
    onPointerUp: releasePointer,
    onPointerCancel: releasePointer,
    onLostPointerCapture: releasePointer,
    onBlur: () => {
      keys.current.clear();
      pointer.current = null;
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!REEL_KEYS.includes(event.code)) return;
      event.preventDefault();
      event.stopPropagation();
      keys.current.add(event.code);
    },
    onKeyUp: (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!REEL_KEYS.includes(event.code)) return;
      event.preventDefault();
      event.stopPropagation();
      keys.current.delete(event.code);
    },
  };

  return { fight, buttonRef, reelHandlers };
}
