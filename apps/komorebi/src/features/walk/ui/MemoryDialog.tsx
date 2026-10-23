import { useModal } from '@features/walk/model/hooks';
import { LANDMARKS, type Landmark } from '@shared/world/world';
import { useId } from 'react';
import { Icon } from './Icon';

type Props = { isOpen: boolean; memory: Landmark | null; collectedCount: number; onClose: () => void };

export function MemoryDialog({ isOpen, memory, collectedCount, onClose }: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  return (
    <dialog
      className="memory-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button className="tool memory-close" aria-label="추억 닫기" onClick={onClose}>
        <Icon name="close" />
      </button>
      <span className="memory-symbol">{memory?.icon}</span>
      <span className="eyebrow">A PIECE OF SUMMER</span>
      <h2 id={titleId}>{memory?.name}</h2>
      <p>{memory?.text}</p>
      <span className="memory-line" />
      <span className="memory-count">
        여름의 조각 {collectedCount} / {LANDMARKS.length}
      </span>
      <button className="continue-button" onClick={onClose}>
        조금 더 걸어 볼까 <Icon name="arrow" />
      </button>
    </dialog>
  );
}
