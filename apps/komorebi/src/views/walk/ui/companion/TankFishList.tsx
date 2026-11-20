import { COMPANION_ACTION } from '@views/walk/lib/companions';
import type { CompanionFish, CompanionPanelModel } from '@views/walk/model/hooks/useCompanionPanel';
import { FishEntry } from '@views/walk/ui/companion/FishEntry';

interface TankFishListProps {
  tank: readonly CompanionFish[];
  isBagFull: boolean;
  act: CompanionPanelModel['act'];
}

export function TankFishList({ tank, isBagFull, act }: TankFishListProps) {
  return (
    <details className="companion-fish-list">
      <summary>함께 사는 물고기 · {tank.length}마리</summary>
      {!tank.length && <p>아직 조용한 수조예요. 부두에서 만난 물고기를 데려와 보세요.</p>}
      {tank.map((fish) => (
        <FishEntry
          key={fish.uid}
          fish={fish}
          actionLabel="살림망으로"
          isActionDisabled={isBagFull}
          onAction={() => act({ kind: COMPANION_ACTION.bag, uid: fish.uid })}
        />
      ))}
    </details>
  );
}
