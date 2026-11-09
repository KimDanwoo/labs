import { useState, useSyncExternalStore } from 'react';
import {
  type CompanionReaction,
  COMPANION_ACTION,
  COMPANION_REACTION,
  FISH_HOME,
  TANK_CAPACITY,
  catBond,
} from '../lib/companions';
import { companionStore } from '../model/store/companions';

export function CatchChoices({ uid, onReact }: { uid: string | null; onReact: (reaction: CompanionReaction) => void }) {
  const state = useSyncExternalStore(companionStore.subscribe, companionStore.get, companionStore.getServer);
  const [message, setMessage] = useState('');
  const fish = state.fish.find((item) => item.uid === uid);
  const tankCount = state.fish.filter((item) => item.home === FISH_HOME.tank).length;
  function choose(kind: typeof COMPANION_ACTION.tank | typeof COMPANION_ACTION.share) {
    if (!uid) return;
    const result = companionStore.act({ kind, uid });
    if (!result.changed) return;
    if (kind === COMPANION_ACTION.share) onReact(COMPANION_REACTION.share);
    const note =
      kind === COMPANION_ACTION.tank
        ? '집 수조로 데려갔어요. 집에 가서 만나 봐요!'
        : '삼색이가 냠냠! 조금 더 가까워졌어요.';
    setMessage(result.saved ? note : `${note} 저장하지 못해 이번 산책에서만 유지돼요.`);
  }
  return (
    <div className="companion-choices">
      {fish?.home === FISH_HOME.bag && (
        <>
          <small>살림망에 보관했어요 · 나중에 골라도 괜찮아요</small>
          <div className="companion-buttons">
            <button disabled={tankCount >= TANK_CAPACITY} onClick={() => choose(COMPANION_ACTION.tank)}>
              🐠 수조로 데려가기 ({tankCount}/{TANK_CAPACITY})
            </button>
            <button onClick={() => choose(COMPANION_ACTION.share)}>🐈 고양이와 나누기</button>
          </div>
          {tankCount >= TANK_CAPACITY && <small>수조가 가득 찼어요. 집에서 물고기를 살림망으로 옮겨 주세요.</small>}
        </>
      )}
      {!uid && <small>살림망이 가득 차 바다로 돌려보냈어요. 도감 기록은 남아 있어요.</small>}
      <p role="status">{message || (fish?.home === FISH_HOME.tank ? '집 수조에서 헤엄치고 있어요.' : '')}</p>
      <small>
        삼색이 · {catBond(state.friendship).name} · {'♥'.repeat(state.friendship)}
        {'♡'.repeat(5 - state.friendship)}
      </small>
    </div>
  );
}
