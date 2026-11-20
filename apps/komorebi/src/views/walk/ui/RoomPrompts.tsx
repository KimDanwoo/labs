import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { CLASSROOM_BOARD, HOME_DESK, HOME_WARDROBE } from '@views/walk/model/world/world';
import { InteractPrompt } from '@views/walk/ui/InteractPrompt';

export function RoomPrompts() {
  const { spots, interact: onInteract } = useWalkContext();
  return (
    <>
      {spots.isNearDesk && <InteractPrompt landmark={HOME_DESK} hint="그림일기 펼치기" onInteract={onInteract} />}
      {spots.isNearWardrobe && <InteractPrompt landmark={HOME_WARDROBE} hint="옷 갈아입기" onInteract={onInteract} />}
      {spots.isNearBoard && (
        <InteractPrompt landmark={CLASSROOM_BOARD} hint="칠판에 낙서하기" onInteract={onInteract} />
      )}
    </>
  );
}
