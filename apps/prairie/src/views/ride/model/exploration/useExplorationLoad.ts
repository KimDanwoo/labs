import { useEffect } from 'react';
import { loadExploration } from './store';

export function useExplorationLoad(): void {
  useEffect(() => {
    loadExploration();
  }, []);
}
