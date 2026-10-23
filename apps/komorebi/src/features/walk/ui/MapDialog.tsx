import { useModal } from '@features/walk/model/hooks';
import { LANDMARKS, type Point, type Region } from '@shared/world/world';
import { useId } from 'react';
import { DiscoveryList } from './DiscoveryList';
import { Icon } from './Icon';
import { WalkMap } from './WalkMap';

type Props = {
  isOpen: boolean;
  isReady: boolean;
  region: Region;
  position: Point;
  steps: number;
  visited: readonly string[];
  eveningVisited: readonly string[];
  onClose: () => void;
  onGuide: (id: string) => void;
  onRead: (id: string) => void;
  onReset: () => void;
};

function journeyLine(dayCount: number, eveningCount: number, steps: number) {
  if (eveningCount === LANDMARKS.length) return '열두 장의 여름, 낮도 노을도 모두 모았어요.';
  if (dayCount === LANDMARKS.length) return '여섯 조각의 여름을 모았어요. 노을빛으로도 걸어 볼까요?';
  return `${steps.toLocaleString()} 걸음만큼 쌓인 여름`;
}

export function MapDialog({
  isOpen,
  isReady,
  region,
  position,
  steps,
  visited,
  eveningVisited,
  onClose,
  onGuide,
  onRead,
  onReset,
}: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  return (
    <dialog
      className="map-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
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
      <DiscoveryList
        visited={visited}
        eveningVisited={eveningVisited}
        isReady={isReady}
        onGuide={onGuide}
        onRead={onRead}
      />
      <div className="map-footer">
        <span>{journeyLine(visited.length, eveningVisited.length, steps)}</span>
        <button onClick={onReset}>
          <Icon name="home" /> 마을 입구로
        </button>
      </div>
    </dialog>
  );
}
