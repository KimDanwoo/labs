import { LANDMARKS } from '../model/world/landmarks';
import { ControlsHint } from './ControlsHint';
import { Icon } from './Icon';

interface BottomBarProps {
  place: string;
  visited: readonly string[];
  shouldShowHint: boolean;
  isPaused?: boolean;
  onOpenJournal: () => void;
}

export function BottomBar({ place, visited, shouldShowHint, isPaused = false, onOpenJournal }: BottomBarProps) {
  return (
    <footer className="bottom-bar">
      <div className="location">
        <span className="location-marker">⌖</span>
        <div>
          <span className="small-label">지금, 여기</span>
          <strong>{place}</strong>
        </div>
      </div>
      {shouldShowHint && <ControlsHint />}
      <button className="journal-button" disabled={isPaused} onClick={onOpenJournal}>
        <span className="journal-dots">
          {LANDMARKS.map((p) => (
            <span key={p.id} className={visited.includes(p.id) ? 'filled' : ''} />
          ))}
        </span>
        <span>
          그림일기{' '}
          <b>
            {visited.length} / {LANDMARKS.length}
          </b>
        </span>
        <Icon name="arrow" />
      </button>
    </footer>
  );
}
