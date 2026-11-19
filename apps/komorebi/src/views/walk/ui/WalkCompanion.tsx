import { COMPANION_PANEL } from '../lib/companions';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { CompanionPanel } from './CompanionPanel';

export function WalkCompanion() {
  const { engine, activities } = useWalkContext();
  if (activities.companionPanel === COMPANION_PANEL.none) return null;
  return (
    <CompanionPanel
      key={activities.companionPanel}
      kind={activities.companionPanel}
      onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
      onClose={activities.closeCompanion}
    />
  );
}
