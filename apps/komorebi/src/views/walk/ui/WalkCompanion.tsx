import { COMPANION_PANEL } from '@views/walk/lib/companions';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { CompanionPanel } from '@views/walk/ui/CompanionPanel';

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
