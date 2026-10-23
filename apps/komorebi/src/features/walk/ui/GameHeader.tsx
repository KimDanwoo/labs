import type { TimeOfDay } from '@features/walk/model/constants';
import { Icon } from './Icon';
import { TIME_ICON } from './timeIcon';

type Props = { timeOfDay: TimeOfDay };

const CLOCK = { day: '오후 2시 30분', evening: '해 질 녘', night: '밤 8시' } satisfies Record<TimeOfDay, string>;

export function GameHeader({ timeOfDay }: Props) {
  return (
    <header className="game-header">
      <div className="day-card">
        <span className="day-sun">
          <Icon name={TIME_ICON[timeOfDay]} />
        </span>
        <div>
          <span className="day-label">여름방학</span>
          <strong>첫째 날</strong>
          <small>{CLOCK[timeOfDay]}</small>
        </div>
      </div>
      <h1 className="game-name">
        여름빛 산책 <span>木漏れ日</span>
      </h1>
    </header>
  );
}
