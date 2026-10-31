import { FIGHT_OUTCOME, startFight, stepFight, type Catch, type Fight } from '@features/walk/lib/fishing';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

export function FishingFight({
  fish,
  isPerfect,
  onFinish,
}: {
  fish: Catch;
  isPerfect: boolean;
  onFinish: (outcome: Fight['outcome']) => void;
}) {
  const [fight, setFight] = useState(() => startFight(isPerfect));
  const current = useRef(fight);
  const isHolding = useRef(false);
  const button = useRef<HTMLButtonElement>(null);
  const finish = useEffectEvent(onFinish);
  useEffect(() => {
    button.current?.focus();
    let previous = performance.now();
    const release = () => {
      isHolding.current = false;
    };
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - previous) / 1000;
      previous = now;
      if (document.hidden) return;
      const next = stepFight(current.current, isHolding.current, dt, fish.size);
      current.current = next;
      setFight(next);
      if (next.outcome !== FIGHT_OUTCOME.active) {
        window.clearInterval(timer);
        navigator.vibrate?.(next.outcome === FIGHT_OUTCOME.landed ? [40, 30, 80] : 90);
        finish(next.outcome);
      }
    }, 50);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, [fish.size]);
  const isDanger = fight.tension > 80 || fight.tension < 20;
  return (
    <section className={`fishing-fight ${isDanger ? 'is-danger' : ''}`} aria-label="물고기와 줄다리기">
      <strong className="fishing-hook-result">{isPerfect ? '완벽한 챔질!' : '걸렸다!'} 물고기가 버텨요</strong>
      <label>
        줄 장력 <meter min={0} max={100} low={20} high={80} optimum={50} value={fight.tension} />
        <span>
          {Math.round(fight.tension)}% · {isDanger ? '위험! 줄을 조절해요' : '적당한 장력을 유지해요'}
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
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          isHolding.current = true;
        }}
        onPointerUp={() => {
          isHolding.current = false;
        }}
        onPointerCancel={() => {
          isHolding.current = false;
        }}
        onLostPointerCapture={() => {
          isHolding.current = false;
        }}
        onBlur={() => {
          isHolding.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') {
            event.preventDefault();
            event.stopPropagation();
            isHolding.current = true;
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') {
            event.preventDefault();
            event.stopPropagation();
            isHolding.current = false;
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
