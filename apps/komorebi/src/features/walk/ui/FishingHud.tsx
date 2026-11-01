import type { createAmbience } from '@features/walk/lib/audio';
import { CATCH_CELEBRATION_SECONDS } from '@features/walk/lib/catchCelebration';
import {
  BITE_WINDOW_MS,
  CAST_SECONDS,
  FIGHT_OUTCOME,
  FISH,
  FISHING_PHASE,
  FISHING_STORAGE_KEY,
  FISH_RARITY,
  addCatch,
  isBiteOnTime,
  isRareFish,
  parseCollection,
  rollCatch,
  type Catch,
  type Fight,
  type FishingFrame,
  type FishingPhase,
} from '@features/walk/lib/fishing';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { FishingFight } from './FishingFight';

export function FishingHud({
  onClose,
  onFrame,
  onSound,
}: {
  onClose: () => void;
  onSound: ReturnType<typeof createAmbience>['fishingCue'];
  onFrame: (frame: FishingFrame | null) => void;
}) {
  const [phase, setPhase] = useState<FishingPhase>(FISHING_PHASE.casting);
  const [caught, setCaught] = useState<Catch | null>(null);
  const [collection, setCollection] = useState(() => {
    try {
      return parseCollection(localStorage.getItem(FISHING_STORAGE_KEY));
    } catch {
      return {};
    }
  });
  const [isNew, setIsNew] = useState(false);
  const [isRecord, setIsRecord] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [failure, setFailure] = useState('물고기가 달아났어요. 다시 해 볼까요?');
  const deadline = useRef(0);
  const hasReeled = useRef(false);
  const publish = useEffectEvent(onFrame);
  const playSound = useEffectEvent(() => {
    if (phase === FISHING_PHASE.casting) onSound('cast');
    else if (phase === FISHING_PHASE.waiting) onSound('waiting');
    else if (phase === FISHING_PHASE.bite) {
      onSound('bite');
      navigator.vibrate?.([25, 50, 25]);
    } else if (phase === FISHING_PHASE.fighting) onSound('hook');
    else if (phase === FISHING_PHASE.caught) onSound(caught && isRareFish(caught.id) ? 'rare' : 'success');
    else if (phase === FISHING_PHASE.missed) onSound('miss');
  });
  useEffect(() => {
    playSound();
  }, [phase]);
  useEffect(() => {
    if (phase !== FISHING_PHASE.fighting)
      publish({ phase, elapsed: 0, tension: 0, progress: 0, isReeling: false, caught });
  }, [phase, caught]);
  useEffect(() => () => publish(null), []);
  useEffect(() => {
    if (phase === FISHING_PHASE.caught) {
      const timer = window.setTimeout(() => setIsCelebrating(false), CATCH_CELEBRATION_SECONDS * 1000);
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.casting) {
      const timer = window.setTimeout(() => setPhase(FISHING_PHASE.waiting), CAST_SECONDS * 1000);
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.waiting) {
      const timer = window.setTimeout(
        () => {
          deadline.current = Date.now() + BITE_WINDOW_MS;
          setPhase(FISHING_PHASE.bite);
        },
        2500 + Math.random() * 3500,
      );
      return () => window.clearTimeout(timer);
    }
    if (phase === FISHING_PHASE.bite) {
      const timer = window.setTimeout(() => setPhase(FISHING_PHASE.missed), Math.max(0, deadline.current - Date.now()));
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [phase]);
  function finishFight(outcome: Fight['outcome']) {
    if (outcome !== FIGHT_OUTCOME.landed || !caught) {
      setFailure(
        outcome === FIGHT_OUTCOME.snapped ? '팽! 너무 당겨 줄이 끊어졌어요.' : '줄이 느슨해져 물고기가 빠져나갔어요.',
      );
      setPhase(FISHING_PHASE.missed);
      return;
    }
    const updated = addCatch(collection, caught);
    setIsNew(!collection[caught.id]);
    setIsRecord(Boolean(collection[caught.id] && caught.size > collection[caught.id]!.best));
    setIsCelebrating(true);
    setCollection(updated);
    try {
      localStorage.setItem(FISHING_STORAGE_KEY, JSON.stringify(updated));
      setHasSaveError(false);
    } catch {
      setHasSaveError(true);
    }
    setPhase(FISHING_PHASE.caught);
  }
  function act() {
    if (phase === FISHING_PHASE.fighting || phase === FISHING_PHASE.casting || isCelebrating) return;
    if (phase === FISHING_PHASE.waiting || phase === FISHING_PHASE.bite) {
      if (hasReeled.current) return;
      hasReeled.current = true;
      if (phase !== FISHING_PHASE.bite || !isBiteOnTime(Date.now(), deadline.current)) {
        setPhase(FISHING_PHASE.missed);
        return;
      }
      setIsPerfect(Date.now() < deadline.current - BITE_WINDOW_MS + 450);
      setCaught(rollCatch());
      navigator.vibrate?.([25, 30, 60]);
      setPhase(FISHING_PHASE.fighting);
      return;
    }
    setFailure('물고기가 달아났어요. 다시 해 볼까요?');
    hasReeled.current = false;
    setCaught(null);
    setIsRecord(false);
    setPhase(FISHING_PHASE.casting);
  }
  const handleAct = useEffectEvent(act);
  const handleClose = useEffectEvent(onClose);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        handleAct();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const fish = FISH.find((item) => item.id === caught?.id);
  const messages = {
    [FISHING_PHASE.casting]: '낚싯대를 휘둘러 바다로 던져요…',
    [FISHING_PHASE.idle]: '바람을 느끼며 낚싯줄을 던져 보세요.',
    [FISHING_PHASE.waiting]: '찌가 잠길 때까지 잠깐 기다려요…',
    [FISHING_PHASE.bite]: '지금! 낚싯대를 올려요!',
    [FISHING_PHASE.missed]: failure,
    [FISHING_PHASE.fighting]: '쭉 당겨요! 물고기가 힘을 쓰면 잠깐 놓아 주세요.',
    [FISHING_PHASE.caught]:
      fish && caught ? `${isNew ? '처음 만난 물고기! ' : ''}${fish.name} · ${caught.size} cm` : '',
  };
  let actionLabel = '다시 던지기';
  if (phase === FISHING_PHASE.bite) actionLabel = '챔질하기!';
  if (phase === FISHING_PHASE.waiting) actionLabel = '낚싯줄 걷기';
  if (phase === FISHING_PHASE.casting) actionLabel = '줄을 던지는 중';
  const isLegendary = fish?.rarity === FISH_RARITY.legendary;
  let badge = '잡았다!';
  if (isRecord) badge = '최대 크기 신기록!';
  if (isNew) badge = '새로운 물고기 발견!';
  if (isLegendary) badge = `전설의 물고기! ${isNew ? '첫 발견' : ''}`;
  return (
    <section className="pier-fishing-hud" aria-label="부두 낚시" data-phase={phase}>
      <div className="pier-fishing-heading">
        <strong>🎣 부두에서 낚시 중</strong>
        <button onClick={onClose} aria-label="낚시 그만하기">
          그만하기 <kbd>Esc</kbd>
        </button>
      </div>
      {phase === FISHING_PHASE.caught && fish && caught && (
        <div className={`catch-result ${isLegendary ? 'is-legendary' : ''}`} aria-label="잡은 물고기">
          <span className="catch-result-symbol" aria-hidden="true">
            {fish.symbol}
          </span>
          <div>
            <small>{badge}</small>
            <strong>
              {fish.name} <span>{caught.size} cm</span>
            </strong>
            <small>
              {fish.rarity} · {hasSaveError ? '저장 확인이 필요해요' : '도감에 기록했어요'}
            </small>
          </div>
        </div>
      )}
      <p role="status" className={phase === FISHING_PHASE.bite ? 'pier-bite-message' : ''}>
        {messages[phase]}
      </p>
      {phase === FISHING_PHASE.fighting && caught ? (
        <FishingFight fish={caught} isPerfect={isPerfect} onFinish={finishFight} onFrame={onFrame} />
      ) : (
        <button className="continue-button" onClick={act} disabled={phase === FISHING_PHASE.casting || isCelebrating}>
          <kbd>E</kbd> {isCelebrating ? '잡았다! ♥' : actionLabel}
        </button>
      )}
      <small>
        {phase === FISHING_PHASE.caught
          ? '기록은 이 브라우저에 보관돼요 · E로 다시 던지기'
          : '바다의 찌를 보세요 · 입질하면 E로 챔질'}
      </small>
      <details className="pier-journal">
        <summary>
          바다 도감 · {Object.keys(collection).length} / {FISH.length}
        </summary>
        {FISH.map((item) => (
          <div className="fishing-entry" key={item.id}>
            <span>{collection[item.id] ? `${item.symbol} ${item.name}` : '아직 만나지 못한 물고기'}</span>
            <small>
              {collection[item.id]
                ? `${item.rarity} · ${collection[item.id]!.count}마리 · 최대 ${collection[item.id]!.best} cm`
                : item.rarity}
            </small>
          </div>
        ))}
      </details>
      {hasSaveError && <p role="alert">도감을 저장하지 못했어요. 현재 화면에서는 기록을 볼 수 있어요.</p>}
    </section>
  );
}
