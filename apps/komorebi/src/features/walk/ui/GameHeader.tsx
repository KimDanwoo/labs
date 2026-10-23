import { TIME_LABEL, type TimeOfDay } from '@features/walk/model/constants';

type Props = { timeOfDay: TimeOfDay };

export function GameHeader({ timeOfDay }: Props) {
  return (
    <header className="game-header">
      <h1 className="game-name">여름빛 산책</h1>
      <p className="game-time">{TIME_LABEL[timeOfDay]}</p>
    </header>
  );
}
