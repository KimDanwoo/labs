import type { RefObject } from 'react';

interface CompanionHeadingProps {
  title: string;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function CompanionHeading({ title, closeButtonRef, onClose }: CompanionHeadingProps) {
  return (
    <div className="pier-fishing-heading">
      <strong>{title}</strong>
      <button ref={closeButtonRef} onClick={onClose}>
        닫기 <kbd>Esc</kbd>
      </button>
    </div>
  );
}
