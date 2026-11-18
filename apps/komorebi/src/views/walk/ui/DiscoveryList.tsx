import { TIME_ORDER, type TimeOfDay } from '../config/walk';
import { keptLabel } from '../lib/discovery';
import { LANDMARKS } from '../model/world/world';

interface DiscoveryListProps {
  pages: Record<TimeOfDay, readonly string[]>;
  isReady: boolean;
  isJournal?: boolean;
  onGuide: (id: string) => void;
  onRead: (id: string) => void;
}

export function DiscoveryList({ pages, isReady, isJournal = false, onGuide, onRead }: DiscoveryListProps) {
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
