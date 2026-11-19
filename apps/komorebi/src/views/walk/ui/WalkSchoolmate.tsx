import { FRIEND_ACTIVITY } from '../config/walk';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { SchoolmateDialog } from './SchoolmateDialog';

export function WalkSchoolmate() {
  const { activities, friendRegion } = useWalkContext();
  const { activeFriend, friendActivity } = activities;
  if (!activeFriend || !friendRegion || friendActivity.kind !== FRIEND_ACTIVITY.greeting) return null;
  return <SchoolmateDialog friend={activeFriend} region={friendRegion} />;
}
