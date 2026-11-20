import { DIALOG, TIME_ORDER } from '@views/walk/config/walk';
import { keptLabel } from '@views/walk/lib/discovery';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { LANDMARKS } from '@views/walk/model/world/landmarks';

export function DiscoveryList() {
  const { dialog, collection, isReady, guideTo: onGuide, readMemory: onRead } = useWalkContext();
  const { pages } = collection;
  const isJournal = dialog === DIALOG.journal;
  return (
    <div className="discovery-list">
      {LANDMARKS.map((p) => {
        const keptAt = TIME_ORDER.filter((time) => pages[time].includes(p.id));
        const isCollected = keptAt.length > 0;
        const stampTimes = keptAt.map((time) => `kept-${time}`).join(' ');
        return (
          <div key={p.id} className="discovery-item">
            <button
              className="discovery-guide"
              aria-label={isJournal && isCollected ? `${p.name} 추억 다시 읽기` : undefined}
              onClick={() => (isJournal ? onRead(p.id) : onGuide(p.id))}
              disabled={isJournal ? !isCollected : !isReady}
            >
              <span className={`stamp ${isCollected ? 'collected' : ''} ${stampTimes}`}>{p.icon}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{keptLabel(keptAt)}</small>
              </div>
              <span className="discovery-check">{isCollected ? '✓' : '→'}</span>
            </button>
            {isCollected && !isJournal && (
              <button className="discovery-read" aria-label={`${p.name} 추억 다시 읽기`} onClick={() => onRead(p.id)}>
                읽기
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
