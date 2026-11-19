import { COMPANION_PANEL_COPY } from '../config/companion';
import {
  BAG_CAPACITY,
  TANK_CAPACITY,
  catBond,
  type CompanionPanelKind,
  type CompanionReaction,
} from '../lib/companions';
import { companionSummary } from '../lib/companionSummary';
import { useCompanionPanel } from '../model/hooks/useCompanionPanel';
import { AquariumView } from './AquariumView';
import { BagFishList } from './companion/BagFishList';
import { CompanionHeading } from './companion/CompanionHeading';
import { TankFishList } from './companion/TankFishList';

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
  const copy = isTank ? COMPANION_PANEL_COPY.tank : COMPANION_PANEL_COPY.cat;

  return (
    <section className={copy.className} aria-label={copy.label}>
      <CompanionHeading title={copy.title} closeButtonRef={closeButtonRef} onClose={onClose} />
      <p>{companionSummary(isTank, tank.length, friendship)}</p>
      {isTank ? (
        <AquariumView fish={tank} isFeeding={isReacting} />
      ) : (
        <small>{catBond(friendship).hint} 물고기 2마리면 친구, 5마리면 낚시 단짝이 돼요.</small>
      )}
      <button className="continue-button" disabled={isReacting || (isTank && !tank.length)} onClick={react}>
        {copy.reactLabel}
      </button>
      <p role="status">{message}</p>
      {isTank && <TankFishList tank={tank} isBagFull={bag.length >= BAG_CAPACITY} act={act} />}
      <BagFishList
        bag={bag}
        isTank={isTank}
        isOpen={!isTank || !tank.length}
        isTankFull={isTank && tank.length >= TANK_CAPACITY}
        act={act}
      />
      <small>수조와 삼색이의 친밀도는 이 브라우저에 기억해요.</small>
    </section>
  );
}
