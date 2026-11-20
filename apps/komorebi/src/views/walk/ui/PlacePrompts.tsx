import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { InteractPrompt } from '@views/walk/ui/InteractPrompt';

export function PlacePrompts() {
  const { spots, nearbyFriend, status, promptHint, interact: onInteract } = useWalkContext();
  const friendName = nearbyFriend?.name;
  const nearby = status.nearby;
  const { isNearBoard, isAtPier, isNearCat, isNearAquarium } = spots;
  const isNearPlace = !friendName && !isAtPier && !isNearCat && !isNearAquarium && !isNearBoard;
  return (
    <>
      {friendName && !isNearBoard && (
        <InteractPrompt landmark={{ name: friendName }} hint="친구에게 인사하기" onInteract={onInteract} />
      )}
      {nearby && isNearPlace && <InteractPrompt landmark={nearby} hint={promptHint(nearby)} onInteract={onInteract} />}
    </>
  );
}
