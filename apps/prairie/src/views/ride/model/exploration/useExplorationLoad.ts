import { loadExploration } from '@views/ride/model/exploration/store';
import { useEffect } from 'react';

export function useExplorationLoad(): void {
  useEffect(() => {
    loadExploration();
  }, []);
}
