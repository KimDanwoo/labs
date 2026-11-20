import { BAG_CAPACITY, COMPANION_ACTION } from '@views/walk/lib/companions';
import type { CompanionFish, CompanionPanelModel } from '@views/walk/model/hooks/useCompanionPanel';
import { FishEntry } from '@views/walk/ui/companion/FishEntry';

interface BagFishListProps {
  bag: readonly CompanionFish[];
  isTank: boolean;
  isOpen: boolean;
  isTankFull: boolean;
  act: CompanionPanelModel['act'];
}

export function BagFishList({ bag, isTank, isOpen, isTankFull, act }: BagFishListProps) {
  return (
    <details className="pier-journal" open={isOpen}>
      <summary>
        살림망 · {bag.length}/{BAG_CAPACITY}
      </summary>
      {!bag.length && <p>낚시로 만난 물고기가 여기에 머물러요. 예전 도감 기록은 그대로 보관돼요.</p>}
      {bag.map((fish) => (
        <FishEntry
          key={fish.uid}
          fish={fish}
          actionLabel={isTank ? '수조에 넣기' : '삼색이와 나누기'}
          isActionDisabled={isTankFull}
          onAction={() => act({ kind: isTank ? COMPANION_ACTION.tank : COMPANION_ACTION.share, uid: fish.uid })}
        />
      ))}
    </details>
  );
}
