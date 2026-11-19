import type { JSX } from 'react';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { FISHING_PIER, HOME_AQUARIUM, PIER_CAT } from '../model/world/landmarks';
import { CLASSROOM_BOARD, HOME_DESK, HOME_WARDROBE } from '../model/world/world';
import { InteractPrompt } from './InteractPrompt';

export function WalkPrompts(): JSX.Element | null {
  const { isPaused, spots, nearbyFriend, status, promptHint, interact: onInteract } = useWalkContext();
  if (isPaused) return null;
  const friendName = nearbyFriend?.name;
  const nearby = status.nearby;
  const { isNearDesk, isNearWardrobe, isNearBoard, isAtPier, isNearCat, isNearAquarium } = spots;
  const isNearPlace = !friendName && !isAtPier && !isNearCat && !isNearAquarium && !isNearBoard;
  return (
    <>
      {isNearDesk && <InteractPrompt landmark={HOME_DESK} hint="그림일기 펼치기" onInteract={onInteract} />}
      {isNearWardrobe && <InteractPrompt landmark={HOME_WARDROBE} hint="옷 갈아입기" onInteract={onInteract} />}
      {isNearBoard && <InteractPrompt landmark={CLASSROOM_BOARD} hint="칠판에 낙서하기" onInteract={onInteract} />}
      {friendName && !isNearBoard && (
        <InteractPrompt landmark={{ name: friendName }} hint="친구에게 인사하기" onInteract={onInteract} />
      )}
      {nearby && isNearPlace && <InteractPrompt landmark={nearby} hint={promptHint(nearby)} onInteract={onInteract} />}
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
