import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import {
  type CompanionAction,
  type CompanionPanelKind,
  type CompanionReaction,
  BAG_CAPACITY,
  COMPANION_ACTION,
  COMPANION_PANEL,
  COMPANION_REACTION,
  FISH_HOME,
  TANK_CAPACITY,
  catBond,
} from '../lib/companions';
import { FISH } from '../lib/fishing';
import { companionStore } from '../model/store/companions';

import { AquariumView } from './AquariumView';

export function CompanionPanel({
  kind,
  onClose,
  onReact,
}: {
  kind: CompanionPanelKind;
  onClose: () => void;
  onReact: (reaction: CompanionReaction) => void;
}) {
  const state = useSyncExternalStore(companionStore.subscribe, companionStore.get, companionStore.getServer);
  const [message, setMessage] = useState('');
  const [isReacting, setIsReacting] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    button.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!isReacting) return undefined;
    const timer = window.setTimeout(() => setIsReacting(false), 3000);
    return () => window.clearTimeout(timer);
  }, [isReacting]);
  const isTank = kind === COMPANION_PANEL.aquarium;
  const tank = state.fish.filter((fish) => fish.home === FISH_HOME.tank);
  const bag = state.fish.filter((fish) => fish.home === FISH_HOME.bag);
  const bond = catBond(state.friendship);
  function act(action: CompanionAction) {
    const result = companionStore.act(action);
    if (!result.changed) {
      setMessage('자리가 부족해요. 먼저 다른 물고기를 옮겨 주세요.');
      return;
    }
    if (action.kind === COMPANION_ACTION.share) onReact(COMPANION_REACTION.share);
    let note = '살림망으로 옮겼어요. 도감 기록은 그대로예요.';
    if (action.kind === COMPANION_ACTION.tank) note = '새로운 보금자리! 수조에서 헤엄치기 시작했어요.';
    if (action.kind === COMPANION_ACTION.share)
      note = `삼색이가 다가와 고개를 비벼요. ${catBond(companionStore.get().friendship).name}!`;
    setMessage(result.saved ? note : `${note} 저장하지 못해 이번 산책에서만 유지돼요.`);
  }
  function react() {
    if (isReacting) return;
    setIsReacting(true);
    onReact(isTank ? COMPANION_REACTION.feed : COMPANION_REACTION.pet);
    setMessage(isTank ? '톡톡, 먹이를 뿌리니 물고기들이 모여들어요.' : '가만히 손을 내미니 삼색이가 고개를 기울여요.');
  }
  return (
    <section
      className={`pier-fishing-hud companion-panel${isTank ? ' aquarium-panel' : ''}`}
      aria-label={isTank ? '우리 집 수조' : '부두 고양이'}
    >
      <div className="pier-fishing-heading">
        <strong>{isTank ? '🐠 창가의 작은 바다' : '🐈 삼색이와 잠깐'}</strong>
        <button ref={button} onClick={onClose}>
          닫기 <kbd>Esc</kbd>
        </button>
      </div>
      <p>
        {isTank
          ? `함께 사는 물고기 ${tank.length}/${TANK_CAPACITY}`
          : `${bond.name} · ${'♥'.repeat(state.friendship)}${'♡'.repeat(5 - state.friendship)}`}
      </p>
      {isTank && <AquariumView fish={tank} isFeeding={isReacting} />}
      {!isTank && <small>{bond.hint} 물고기 2마리면 친구, 5마리면 낚시 단짝이 돼요.</small>}
      <button className="continue-button" disabled={isReacting || (isTank && !tank.length)} onClick={react}>
        {isTank ? '먹이 톡톡 뿌리기' : '손 내밀어 인사하기'}
      </button>
      <p role="status">{message}</p>
      {isTank && (
        <details className="companion-fish-list">
          <summary>함께 사는 물고기 · {tank.length}마리</summary>
          {!tank.length && <p>아직 조용한 수조예요. 부두에서 만난 물고기를 데려와 보세요.</p>}
          {tank.map((fish) => (
            <div className="fishing-entry" key={fish.uid}>
              <span>
                {FISH.find((item) => item.id === fish.id)?.name} · {fish.size} cm
              </span>
              <button
                disabled={bag.length >= BAG_CAPACITY}
                onClick={() => act({ kind: COMPANION_ACTION.bag, uid: fish.uid })}
              >
                살림망으로
              </button>
            </div>
          ))}
        </details>
      )}
      <details className="pier-journal" open={!isTank || !tank.length}>
        <summary>
          살림망 · {bag.length}/{BAG_CAPACITY}
        </summary>
        {!bag.length && <p>낚시로 만난 물고기가 여기에 머물러요. 예전 도감 기록은 그대로 보관돼요.</p>}
        {bag.map((fish) => (
          <div className="fishing-entry" key={fish.uid}>
            <span>
              {FISH.find((item) => item.id === fish.id)?.name} · {fish.size} cm
            </span>
            <button
              disabled={isTank && tank.length >= TANK_CAPACITY}
              onClick={() => act({ kind: isTank ? COMPANION_ACTION.tank : COMPANION_ACTION.share, uid: fish.uid })}
            >
              {isTank ? '수조에 넣기' : '삼색이와 나누기'}
            </button>
          </div>
        ))}
      </details>
      <small>수조와 삼색이의 친밀도는 이 브라우저에 기억해요.</small>
    </section>
  );
}
