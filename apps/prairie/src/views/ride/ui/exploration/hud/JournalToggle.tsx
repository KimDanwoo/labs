import { HUD_PILL_BUTTON } from '../../../config/hud';
import { useExploration } from '../../../model/exploration/store';
import { LANDMARKS } from '../../../model/exploration/world';

interface JournalToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function JournalToggle({ isOpen, onToggle }: JournalToggleProps) {
  const { discovered } = useExploration();
  return (
    <button className={HUD_PILL_BUTTON} onClick={onToggle} aria-expanded={isOpen} aria-controls="exploration-journal">
      발견 기록 {discovered.length} / {LANDMARKS.length}
    </button>
  );
}
