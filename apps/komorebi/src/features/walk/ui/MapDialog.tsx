import { useModal } from '@features/walk/model/hooks';
import { LANDMARKS, type Point, type Region } from '@shared/world/world';
import { useId } from 'react';
import { Icon } from './Icon';
import { WalkMap } from './WalkMap';

type Props = {
  isOpen: boolean;
  isReady: boolean;
  region: Region;
  position: Point;
  steps: number;
  visited: readonly string[];
  onClose: () => void;
  onGuide: (id: string) => void;
  onReset: () => void;
};

export function MapDialog({ isOpen, isReady, region, position, steps, visited, onClose, onGuide, onReset }: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  const isComplete = visited.length === LANDMARKS.length;
  return (
    <dialog
      className="map-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE ADVENTURE</span>
          <h2 id={titleId}>여름을 걷는 지도</h2>
        </div>
        <button className="tool" aria-label="지도 닫기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p className="dialog-intro">
        목적지를 누르면 길을 따라 걸어가요. 도착하면 <kbd>E</kbd>로 추억을 간직하세요.
      </p>
      <WalkMap region={region} position={position} visited={visited} />
      <div className="discovery-list">
        {LANDMARKS.map((p) => {
          const isCollected = visited.includes(p.id);
          return (
            <button key={p.id} onClick={() => onGuide(p.id)} disabled={!isReady}>
              <span className={`stamp ${isCollected ? 'collected' : ''}`}>{p.icon}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{isCollected ? '추억을 간직했어요' : '아직 만나지 않은 풍경'}</small>
              </div>
              <span className="discovery-check">{isCollected ? '✓' : '→'}</span>
            </button>
          );
        })}
      </div>
      <div className="map-footer">
        <span>
          {isComplete
            ? '여섯 조각의 여름, 모두 모았어요. 계속 걸어 볼까요?'
            : `${steps.toLocaleString()} 걸음만큼 쌓인 여름`}
        </span>
        <button onClick={onReset}>
          <Icon name="home" /> 마을 입구로
        </button>
      </div>
    </dialog>
  );
}
