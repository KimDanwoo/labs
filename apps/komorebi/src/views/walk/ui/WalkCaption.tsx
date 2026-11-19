import { useWalkContext } from '../model/hooks/useWalkContext';
import { WORLDS } from '../model/world/worlds';

export function WalkCaption() {
  const { status } = useWalkContext();
  const regionName = WORLDS[status.region].name;
  return (
    <>
      <p className="sr-only" aria-live="polite">
        {regionName}
      </p>
      <div className="scene-caption" key={status.region} aria-hidden="true">
        <span>—</span> {regionName} <span>—</span>
      </div>
    </>
  );
}
