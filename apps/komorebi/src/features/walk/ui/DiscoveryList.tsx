import { LANDMARKS } from '@shared/world/world';

type Props = {
  visited: readonly string[];
  eveningVisited: readonly string[];
  isReady: boolean;
  onGuide: (id: string) => void;
  onRead: (id: string) => void;
};

function collectedLabel(isCollected: boolean, hasEvening: boolean) {
  if (!isCollected) return '아직 만나지 않은 풍경';
  return hasEvening ? '낮도 노을도 간직했어요' : '추억을 간직했어요';
}

export function DiscoveryList({ visited, eveningVisited, isReady, onGuide, onRead }: Props) {
  return (
    <div className="discovery-list">
      {LANDMARKS.map((p) => {
        const isCollected = visited.includes(p.id);
        const hasEvening = eveningVisited.includes(p.id);
        return (
          <div key={p.id} className="discovery-item">
            <button className="discovery-guide" onClick={() => onGuide(p.id)} disabled={!isReady}>
              <span className={`stamp ${isCollected ? 'collected' : ''} ${hasEvening ? 'evening' : ''}`}>{p.icon}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{collectedLabel(isCollected, hasEvening)}</small>
              </div>
              <span className="discovery-check">{isCollected ? '✓' : '→'}</span>
            </button>
            {isCollected && (
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
