import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  FIGHT_OUTCOME,
  FISHING_PHASE,
  fishSurge,
  startFight,
  stepFight,
  type Catch,
  type Fight,
  type FishingFrame,
} from '../lib/fishing';

export function FishingFight({
  fish,
  isPerfect,
  onFinish,
  onFrame,
}: {
  fish: Catch;
  isPerfect: boolean;
  onFinish: (outcome: Fight['outcome']) => void;
  onFrame: (frame: FishingFrame) => void;
}) {
  const [fight, setFight] = useState(() => startFight(isPerfect));
  const current = useRef(fight);
  const keys = useRef(new Set<string>());
  const pointer = useRef<number | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const finish = useEffectEvent(onFinish);
  const publish = useEffectEvent(onFrame);
  useEffect(() => {
    button.current?.focus();
    let previous = performance.now();
    const release = () => {
      keys.current.clear();
      pointer.current = null;
    };
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - previous) / 1000;
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
        navigator.vibrate?.(next.outcome === FIGHT_OUTCOME.landed ? [40, 30, 80] : 90);
        finish(next.outcome);
      }
    }, 50);
    const keydown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE') return;
      event.preventDefault();
      keys.current.add(event.code);
    };
    const keyup = (event: KeyboardEvent) => {
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
  let guidance = fishSurge(fish.id, fight.elapsed) ? '물고기가 힘을 쓰고 있어요!' : '힘이 풀렸어요 · 감을 기회!';
  if (fight.tension > 75) guidance = '줄을 잠깐 풀어요!';
  if (fight.tension < 25) guidance = '지금 감아 주세요!';
  const isDanger = fight.tension > 80 || fight.tension < 20;
  return (
    <section className={`fishing-fight ${isDanger ? 'is-danger' : ''}`} aria-label="물고기와 줄다리기">
      <strong className="fishing-hook-result">{isPerfect ? '완벽한 챔질!' : '걸렸다!'} 물고기가 버텨요</strong>
      <label>
        줄 장력 <meter min={0} max={100} low={20} high={80} optimum={50} value={fight.tension} />
        <span>
          {Math.round(fight.tension)}% · {guidance}
        </span>
      </label>
      <label>
        끌어올리기 <progress max={100} value={fight.progress} />
        <span>{Math.round(fight.progress)}%</span>
      </label>
      <button
        ref={button}
        className="continue-button fishing-reel"
        onPointerDown={(event) => {
          if (event.button !== 0 || pointer.current !== null) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = event.pointerId;
        }}
        onPointerUp={(event) => {
          if (pointer.current === event.pointerId) pointer.current = null;
        }}
        onPointerCancel={(event) => {
          if (pointer.current === event.pointerId) pointer.current = null;
        }}
        onLostPointerCapture={(event) => {
          if (pointer.current === event.pointerId) pointer.current = null;
        }}
        onBlur={() => {
          keys.current.clear();
          pointer.current = null;
        }}
        onKeyDown={(event) => {
          if (['Space', 'Enter', 'KeyE'].includes(event.code)) {
            event.preventDefault();
            event.stopPropagation();
            keys.current.add(event.code);
          }
        }}
        onKeyUp={(event) => {
          if (['Space', 'Enter', 'KeyE'].includes(event.code)) {
            event.preventDefault();
            event.stopPropagation();
            keys.current.delete(event.code);
          }
        }}
      >
        꾹 눌러 릴 감기
      </button>
      <small>
        누르면 감기 · 놓으면 풀기 · 장력 20~80% 유지
        <br />
        너무 당기면 줄이 끊어지고, 너무 풀면 놓쳐요.
      </small>
    </section>
  );
}
