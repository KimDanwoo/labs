import { Icon } from './Icon';

interface InteractPromptProps {
  landmark: { name: string };
  hint: string;
  onInteract: () => void;
}

export function InteractPrompt({ landmark, hint, onInteract }: InteractPromptProps) {
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
