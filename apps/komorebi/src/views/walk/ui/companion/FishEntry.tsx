import { fishName } from '@views/walk/lib/fishTable';
import type { CompanionFish } from '@views/walk/model/hooks/useCompanionPanel';

interface FishEntryProps {
  fish: CompanionFish;
  actionLabel: string;
  isActionDisabled: boolean;
  onAction: () => void;
}

export function FishEntry({ fish, actionLabel, isActionDisabled, onAction }: FishEntryProps) {
  return (
    <div className="fishing-entry">
      <span>
        {fishName(fish.id)} · {fish.size} cm
      </span>
      <button disabled={isActionDisabled} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
