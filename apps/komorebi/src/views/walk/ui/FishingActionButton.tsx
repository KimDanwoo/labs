import { FISHING_PHASE } from '@views/walk/lib/fishing';
import { fishingActionLabel } from '@views/walk/lib/fishingCopy';
import { useFishingContext } from '@views/walk/model/hooks/useFishingContext';

export function FishingActionButton() {
  const { phase, isCelebrating, act } = useFishingContext();
  return (
    <button className="continue-button" onClick={act} disabled={phase === FISHING_PHASE.casting || isCelebrating}>
      <kbd>E</kbd> {isCelebrating ? '잡았다! ♥' : fishingActionLabel(phase)}
    </button>
  );
}
