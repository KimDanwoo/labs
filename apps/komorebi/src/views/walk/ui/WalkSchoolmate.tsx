import { FRIEND_ACTIVITY } from '@views/walk/config/walk';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { SchoolmateDialog } from '@views/walk/ui/SchoolmateDialog';

export function WalkSchoolmate() {
  const { activities, friendRegion } = useWalkContext();
  const { activeFriend, friendActivity } = activities;
  if (!activeFriend || !friendRegion || friendActivity.kind !== FRIEND_ACTIVITY.greeting) return null;
  return <SchoolmateDialog friend={activeFriend} region={friendRegion} />;
}
