import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { FishingHud } from '@views/walk/ui/FishingHud';

export function WalkFishing() {
  const { engine, activities, ambience } = useWalkContext();
  if (!activities.isFishing) return null;
  return (
    <FishingHud
      onSound={ambience.fishingCue}
      onReact={(reaction) => engine.current?.reactToCompanion(reaction)}
      onFrame={(frame) => engine.current?.setFishing(frame)}
      onClose={activities.closeFishing}
    />
  );
}
