import { TIME_ORDER } from '@features/walk/model/constants';
import { useModal, type Collection } from '@features/walk/model/hooks';
import { HOME, LANDMARKS, type Point, type Region } from '@shared/world/world';
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
  collection: Collection;
  onClose: () => void;
  onGuide: (id: string) => void;
  onRead: (id: string) => void;
  onReset: () => void;
};

const ALL_PAGES = LANDMARKS.length * TIME_ORDER.length;

function journeyLine(placeCount: number, pageCount: number, steps: number) {
  if (pageCount === ALL_PAGES) return '열여덟 장의 여름, 낮도 노을도 밤도 모두 모았어요.';
  if (placeCount === LANDMARKS.length) return '여섯 곳을 모두 걸었어요. 다른 시간에도 와 볼까요?';
  return `${steps.toLocaleString()} 걸음만큼 쌓인 여름`;
}

export function MapDialog({
  isOpen,
  isReady,
  region,
  position,
  steps,
  collection,
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
      onClose={(event) => {
        // A late close event from an earlier dismissal must not shut a dialog that was opened again.
        if (!event.currentTarget.open) onClose();
      }}
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
      <WalkMap region={region} position={position} visited={collection.visited} />
      <button className="home-guide" onClick={() => onGuide(HOME.id)} disabled={!isReady}>
        <Icon name="home" />
        <span>
          <strong>{HOME.name}</strong>
          <small>집에 돌아가 쉬어 가기</small>
        </span>
        <Icon name="arrow" />
      </button>
      <DiscoveryList pages={collection.pages} isReady={isReady} onGuide={onGuide} onRead={onRead} />
      <div className="map-footer">
        <span>{journeyLine(collection.visited.length, collection.pageCount, steps)}</span>
        <button onClick={onReset}>
          <Icon name="home" /> 마을 입구로
        </button>
      </div>
    </dialog>
  );
}
