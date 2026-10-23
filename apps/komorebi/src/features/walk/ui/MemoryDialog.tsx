import { TIME_ORDER } from '@features/walk/model/constants';
import { useModal } from '@features/walk/model/hooks';
import type { Memory } from '@features/walk/model/types';
import { LANDMARKS } from '@shared/world/world';
import { useId } from 'react';
import { Icon } from './Icon';

type Props = { isOpen: boolean; memory: Memory | null; pageCount: number; onClose: () => void };

export function MemoryDialog({ isOpen, memory, pageCount, onClose }: Props) {
  const ref = useModal(isOpen);
  const titleId = useId();
  const hasSeveralPages = (memory?.pages.length ?? 0) > 1;
  return (
    <dialog
      className="memory-dialog"
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
      <button className="tool memory-close" aria-label="추억 닫기" onClick={onClose}>
        <Icon name="close" />
      </button>
      <span className="memory-symbol">{memory?.landmark.icon}</span>
      <span className="eyebrow">A PIECE OF SUMMER</span>
      <h2 id={titleId}>{memory?.landmark.name}</h2>
      {memory?.pages.map((page) => (
        <p key={page.label}>
          {hasSeveralPages && <small className="memory-time">{page.label}</small>}
          {page.text}
        </p>
      ))}
      <span className="memory-line" />
      <span className="memory-count">
        여름의 조각 {pageCount} / {LANDMARKS.length * TIME_ORDER.length}
      </span>
      <button className="continue-button" onClick={onClose}>
        조금 더 걸어 볼까 <Icon name="arrow" />
      </button>
    </dialog>
  );
}
