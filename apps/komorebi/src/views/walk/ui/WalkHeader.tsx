import { TIME_LABEL } from '../config/walk';
import { useWalkContext } from '../model/hooks/useWalkContext';

export function WalkHeader() {
  const { timeOfDay, today } = useWalkContext();
  return (
    <header className="game-header">
      <h1 className="game-name">여름빛 산책</h1>
      <p className="game-time">
        {today.day}일째 · {TIME_LABEL[timeOfDay]}
      </p>
    </header>
  );
}
