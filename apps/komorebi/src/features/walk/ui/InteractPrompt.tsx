import type { Landmark } from '@shared/world/world';
import { Icon } from './Icon';

type Props = { landmark: Landmark; hint: string; onInteract: () => void };

export function InteractPrompt({ landmark, hint, onInteract }: Props) {
  return (
    <button className="interact" onClick={onInteract}>
      <kbd>E</kbd>
      <span>
        {landmark.name}
        <small>{hint}</small>
      </span>
      <Icon name="arrow" />
    </button>
  );
}
