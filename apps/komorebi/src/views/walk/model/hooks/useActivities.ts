import { FRIEND_ACTIVITY } from '@views/walk/config/walk';
import { COMPANION_PANEL, type CompanionPanelKind } from '@views/walk/lib/companions';
import type { WalkEngine } from '@views/walk/lib/scene';
import { SCHOOLMATES } from '@views/walk/model/schoolmateRoster';
import type { FriendActivity } from '@views/walk/model/types/friendActivity';
import { useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

export function useActivities(engineRef: RefObject<WalkEngine | null>, onFocusScene: () => void) {
  const [companionPanel, setCompanionPanel] = useState<CompanionPanelKind>(COMPANION_PANEL.none);
  const [isFishing, setIsFishing] = useState(false);
  const [friendActivity, setFriendActivity] = useState<FriendActivity>({ kind: FRIEND_ACTIVITY.none });
  const isWithCompanion = companionPanel !== COMPANION_PANEL.none;
  const isWithFriend = friendActivity.kind !== FRIEND_ACTIVITY.none;
  const activeFriend =
    friendActivity.kind === FRIEND_ACTIVITY.none ? null : SCHOOLMATES.find((friend) => friend.id === friendActivity.id);

  function closeCompanion() {
    setCompanionPanel(COMPANION_PANEL.none);
    onFocusScene();
  }
  function closeFishing() {
    engineRef.current?.setFishing(null);
    setIsFishing(false);
    onFocusScene();
  }
  function closeFriend() {
    engineRef.current?.endSchoolmateGreeting();
    flushSync(() => setFriendActivity({ kind: FRIEND_ACTIVITY.none }));
    onFocusScene();
  }
  function playBall(friend: (typeof SCHOOLMATES)[number]) {
    setFriendActivity({ kind: FRIEND_ACTIVITY.ball, id: friend.id });
  }

  return {
    companionPanel,
    isFishing,
    friendActivity,
    activeFriend,
    isActive: isFishing || isWithCompanion || isWithFriend,
    openCompanion: setCompanionPanel,
    startFishing: () => setIsFishing(true),
    startFriend: setFriendActivity,
    closeCompanion,
    closeFishing,
    closeFriend,
    playBall,
  };
}
