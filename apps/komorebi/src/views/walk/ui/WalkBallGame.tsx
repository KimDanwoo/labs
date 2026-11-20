import { FRIEND_ACTIVITY } from '@views/walk/config/walk';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { BallGameHud } from '@views/walk/ui/BallGameHud';

export function WalkBallGame() {
  const { engine, activities } = useWalkContext();
  const { activeFriend, friendActivity } = activities;
  if (!activeFriend) return null;
  if (friendActivity.kind !== FRIEND_ACTIVITY.ball) return null;
  return (
    <BallGameHud
      name={activeFriend.name}
      onFrame={(frame) => engine.current?.setBallGame(frame) ?? false}
      onClose={activities.closeFriend}
    />
  );
}
