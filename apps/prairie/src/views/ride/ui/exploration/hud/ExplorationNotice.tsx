import { useExploration } from '../../../model/exploration/store';

export function ExplorationNotice() {
  const { notice, nearby } = useExploration();
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm drop-shadow-md">
      {notice || nearby}
    </div>
  );
}
