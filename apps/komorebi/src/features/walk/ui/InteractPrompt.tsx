import type { Landmark } from '@shared/world/world';
import { Icon } from './Icon';

type Props = { landmark: Landmark; isCollected: boolean; onInteract: () => void };

export function InteractPrompt({ landmark, isCollected, onInteract }: Props) {
  return (
    <button className="interact" onClick={onInteract}>
      <kbd>E</kbd>
      <span>
        {landmark.name}
        <small>{isCollected ? '추억 다시 읽기' : '잠깐 머물러 보기'}</small>
      </span>
      <Icon name="arrow" />
    </button>
  );
}
