import { DIALOG } from '../config/walk';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { LANDMARKS } from '../model/world/landmarks';
import { WORLDS } from '../model/world/worlds';
import { ControlsHint } from './ControlsHint';
import { Icon } from './Icon';

export function WalkBottomBar() {
  const { status, collection, isFirstVisit, isReady, hasStarted, isBusy, openDialog } = useWalkContext();
  const place = status.nearby?.short ?? WORLDS[status.region].name;
  const visited = collection.visited;
  const shouldShowHint = isFirstVisit && isReady && !hasStarted;

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
      <button className="journal-button" disabled={isBusy} onClick={() => openDialog(DIALOG.journal)}>
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
