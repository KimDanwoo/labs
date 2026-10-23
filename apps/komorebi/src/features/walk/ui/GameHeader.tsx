import { Icon } from './Icon';

type Props = { isEvening: boolean };

export function GameHeader({ isEvening }: Props) {
  return (
    <header className="game-header">
      <div className="day-card">
        <span className="day-sun">
          <Icon name={isEvening ? 'moon' : 'sun'} />
        </span>
        <div>
          <span className="day-label">여름방학</span>
          <strong>첫째 날</strong>
          <small>{isEvening ? '해 질 녘' : '오후 2시 30분'}</small>
        </div>
      </div>
      <h1 className="game-name">
        여름빛 산책 <span>木漏れ日</span>
      </h1>
    </header>
  );
}
