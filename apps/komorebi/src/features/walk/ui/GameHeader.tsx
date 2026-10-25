import { TIME_LABEL, type TimeOfDay } from '@features/walk/model/constants';

type Props = { timeOfDay: TimeOfDay; day: number };

export function GameHeader({ timeOfDay, day }: Props) {
  return (
    <header className="game-header">
      <h1 className="game-name">코모레비</h1>
      <p className="game-time">
        {day}일째 · {TIME_LABEL[timeOfDay]}
      </p>
    </header>
  );
}
