import {
  addCatch,
  FIGHT_OUTCOME,
  type Fight,
  BITE_WINDOW_MS,
  FISH,
  FISHING_PHASE,
  FISHING_STORAGE_KEY,
  isBiteOnTime,
  parseCollection,
  rollCatch,
  type Catch,
  type FishingPhase,
} from '@features/walk/lib/fishing';
import { useModal } from '@features/walk/model/hooks';
import { FishingFight } from './FishingFight';
import { useEffect, useId, useRef, useState } from 'react';

export function FishingDialog({ onClose }: { onClose: () => void }) {
  const ref = useModal(true);
  const titleId = useId();
  const [phase, setPhase] = useState<FishingPhase>(FISHING_PHASE.idle);
  const [caught, setCaught] = useState<Catch | null>(null);
  const [collection, setCollection] = useState(() => {
    try {
      return parseCollection(localStorage.getItem(FISHING_STORAGE_KEY));
    } catch {
      return {};
    }
  });
  const [isNew, setIsNew] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [failure, setFailure] = useState('물고기가 달아났어요. 다시 해 볼까요?');
  const deadline = useRef(0);
  const hasReeled = useRef(false);
  useEffect(() => {
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
    if (phase === FISHING_PHASE.fighting) return;
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
    setPhase(FISHING_PHASE.waiting);
  }
  const fish = FISH.find((item) => item.id === caught?.id);
  const messages = {
    [FISHING_PHASE.idle]: '바람을 느끼며 낚싯줄을 던져 보세요.',
    [FISHING_PHASE.waiting]: '찌가 잠길 때까지 잠깐 기다려요…',
    [FISHING_PHASE.bite]: '지금! 낚싯대를 올려요!',
    [FISHING_PHASE.missed]: failure,
    [FISHING_PHASE.fighting]: '쭉 당겨요! 물고기가 힘을 쓰면 잠깐 놓아 주세요.',
    [FISHING_PHASE.caught]:
      fish && caught ? `${isNew ? '처음 만난 물고기! ' : ''}${fish.name} · ${caught.size} cm` : '',
  };
  const actionLabel = {
    [FISHING_PHASE.idle]: '낚싯줄 던지기',
    [FISHING_PHASE.waiting]: '낚싯줄 걷기',
    [FISHING_PHASE.bite]: '챔질하기!',
    [FISHING_PHASE.fighting]: '릴 감기',
    [FISHING_PHASE.caught]: '낚싯줄 던지기',
    [FISHING_PHASE.missed]: '낚싯줄 던지기',
  }[phase];
  return (
    <dialog
      ref={ref}
      className="memory-dialog fishing-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (phase === FISHING_PHASE.fighting) return;
        if (event.repeat) {
          if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') event.preventDefault();
          return;
        }
        if (event.key.toLowerCase() === 'e' || (event.key === ' ' && !(event.target instanceof HTMLButtonElement))) {
          event.preventDefault();
          act();
        }
      }}
    >
      <button className="tool memory-close" aria-label="낚시 닫기" onClick={onClose}>
        ×
      </button>
      <span className="eyebrow">A QUIET MOMENT BY THE SEA</span>
      <h2 id={titleId}>바닷가 낚시</h2>
      <div className={`fishing-water is-${phase}`} aria-hidden="true">
        <span className="fishing-line" />
        <span className="fishing-float">{phase === FISHING_PHASE.caught ? fish?.symbol : '●'}</span>
        {phase === FISHING_PHASE.bite && <strong className="fishing-bite">!</strong>}
      </div>
      <p className="fishing-message" role="status">
        {messages[phase]}
      </p>
      {phase === FISHING_PHASE.fighting && caught ? (
        <FishingFight fish={caught} isPerfect={isPerfect} onFinish={finishFight} />
      ) : (
        <button className="continue-button" onClick={act} autoFocus>
          {actionLabel}
        </button>
      )}
      <small>버튼 또는 E · 입질 뒤 1.8초 안에 챔질해요</small>
      <section className="fishing-collection" aria-label="물고기 도감">
        <h3>
          바다 도감 · {Object.keys(collection).length} / {FISH.length}
        </h3>
        {FISH.map((item) => (
          <div key={item.id} className="fishing-entry">
            <span>{collection[item.id] ? `${item.symbol} ${item.name}` : '？ 아직 만나지 못한 물고기'}</span>
            <small>
              {collection[item.id]
                ? `${collection[item.id]!.count}마리 · 최대 ${collection[item.id]!.best} cm`
                : item.rarity}
            </small>
          </div>
        ))}
      </section>
      {hasSaveError && (
        <p role="alert">이 브라우저에서는 도감을 저장하지 못했어요. 현재 화면에서는 기록을 볼 수 있어요.</p>
      )}
    </dialog>
  );
}
