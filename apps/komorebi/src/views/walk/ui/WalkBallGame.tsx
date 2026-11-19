import { FRIEND_ACTIVITY } from '../config/walk';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { BallGameHud } from './BallGameHud';

export function WalkBallGame() {
  const { engine, activities } = useWalkContext();
  const { activeFriend, friendActivity } = activities;
  if (!activeFriend || friendActivity.kind !== FRIEND_ACTIVITY.ball) return null;
  return (
    <BallGameHud
      name={activeFriend.name}
      onFrame={(frame) => engine.current?.setBallGame(frame) ?? false}
      onClose={activities.closeFriend}
    />
  );
}
