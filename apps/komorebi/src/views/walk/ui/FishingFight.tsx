import { FIGHT_GAUGE_MAX, TENSION } from '../config/fishing';
import type { Catch, Fight, FishingFrame } from '../lib/fishing';
import { fightGuidance } from '../lib/fishingCopy';
import { useFishingFight } from '../model/hooks/useFishingFight';

interface FishingFightProps {
  fish: Catch;
  isPerfect: boolean;
  onFinish: (outcome: Fight['outcome']) => void;
  onFrame: (frame: FishingFrame) => void;
}

export function FishingFight({ fish, isPerfect, onFinish, onFrame }: FishingFightProps) {
  const { fight, buttonRef, reelHandlers } = useFishingFight({ fish, isPerfect, onFinish, onFrame });
  const isDanger = fight.tension > TENSION.high || fight.tension < TENSION.low;

  return (
    <section className={isDanger ? 'fishing-fight is-danger' : 'fishing-fight'} aria-label="물고기와 줄다리기">
      <strong className="fishing-hook-result">{isPerfect ? '완벽한 챔질!' : '걸렸다!'} 물고기가 버텨요</strong>
      <label>
        줄 장력{' '}
        <meter
          min={0}
          max={FIGHT_GAUGE_MAX}
          low={TENSION.low}
          high={TENSION.high}
          optimum={TENSION.optimum}
          value={fight.tension}
        />
        <span>
          {Math.round(fight.tension)}% · {fightGuidance(fight, fish.id)}
        </span>
      </label>
      <label>
        끌어올리기 <progress max={FIGHT_GAUGE_MAX} value={fight.progress} />
        <span>{Math.round(fight.progress)}%</span>
      </label>
      <button ref={buttonRef} className="continue-button fishing-reel" {...reelHandlers}>
        꾹 눌러 릴 감기
      </button>
      <small>
        누르면 감기 · 놓으면 풀기 · 장력 {TENSION.low}~{TENSION.high}% 유지
        <br />
        너무 당기면 줄이 끊어지고, 너무 풀면 놓쳐요.
      </small>
    </section>
  );
}
