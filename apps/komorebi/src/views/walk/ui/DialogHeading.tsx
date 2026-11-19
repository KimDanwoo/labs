import { Icon } from './Icon';

interface DialogHeadingProps {
  eyebrow: string;
  title: string;
  titleId: string;
  closeLabel: string;
  onClose: () => void;
}

export function DialogHeading({ eyebrow, title, titleId, closeLabel, onClose }: DialogHeadingProps) {
  return (
    <div className="dialog-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={titleId}>{title}</h2>
      </div>
      <button className="tool" aria-label={closeLabel} onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  );
}
