import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { FISHING_PIER, HOME_AQUARIUM, PIER_CAT } from '@views/walk/model/world/landmarks';
import { InteractPrompt } from '@views/walk/ui/InteractPrompt';

export function SpotPrompts() {
  const { spots, interact: onInteract } = useWalkContext();
  const { isNearAquarium, isNearCat, isAtPier } = spots;
  return (
    <>
      {isNearAquarium && (
        <InteractPrompt landmark={HOME_AQUARIUM} hint="물고기 만나기 · 먹이 주기" onInteract={onInteract} />
      )}
      {isNearCat && <InteractPrompt landmark={PIER_CAT} hint="인사하기 · 물고기 나눠 주기" onInteract={onInteract} />}
      {isAtPier && !isNearCat && (
        <InteractPrompt landmark={FISHING_PIER} hint="부두 끝에서 낚싯줄 던지기" onInteract={onInteract} />
      )}
    </>
  );
}
