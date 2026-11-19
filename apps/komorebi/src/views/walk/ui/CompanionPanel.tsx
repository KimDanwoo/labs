import {
  BAG_CAPACITY,
  COMPANION_ACTION,
  FRIENDSHIP_MAX,
  TANK_CAPACITY,
  catBond,
  type CompanionPanelKind,
  type CompanionReaction,
} from '../lib/companions';
import { FISH } from '../lib/fishTable';
import { useCompanionPanel } from '../model/hooks/useCompanionPanel';
import { AquariumView } from './AquariumView';

interface CompanionPanelProps {
  kind: CompanionPanelKind;
  onClose: () => void;
  onReact: (reaction: CompanionReaction) => void;
}

export function CompanionPanel({ kind, onClose, onReact }: CompanionPanelProps) {
  const { isTank, tank, bag, friendship, message, isReacting, closeButtonRef, act, react } = useCompanionPanel({
    kind,
    onClose,
    onReact,
  });
  const bond = catBond(friendship);

  return (
    <section
      className={isTank ? 'pier-fishing-hud companion-panel aquarium-panel' : 'pier-fishing-hud companion-panel'}
      aria-label={isTank ? '우리 집 수조' : '부두 고양이'}
    >
      <div className="pier-fishing-heading">
        <strong>{isTank ? '🐠 창가의 작은 바다' : '🐈 삼색이와 잠깐'}</strong>
        <button ref={closeButtonRef} onClick={onClose}>
          닫기 <kbd>Esc</kbd>
        </button>
      </div>
      <p>
        {isTank
          ? `함께 사는 물고기 ${tank.length}/${TANK_CAPACITY}`
          : `${bond.name} · ${'♥'.repeat(friendship)}${'♡'.repeat(FRIENDSHIP_MAX - friendship)}`}
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
