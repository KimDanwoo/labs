import { useWalkContext } from '../model/hooks/useWalkContext';

export function WalkLandscape() {
  const { landscapeRef } = useWalkContext();
  return (
    <>
      <div className="landscape" ref={landscapeRef} />
      <div className="paper-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
