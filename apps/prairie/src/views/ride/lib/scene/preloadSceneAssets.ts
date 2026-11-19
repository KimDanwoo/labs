import { COARSE_POINTER_QUERY, FINE_POINTER_QUERY } from '@shared/config/media';
import { preload } from 'react-dom';
import { SKY_FILES } from '../../config/scene';
import { RUNNER_MODEL_URL } from '../../model/runner/constants';

const FETCH = { as: 'fetch', crossOrigin: 'anonymous' } as const;

export function preloadSceneAssets(): void {
  preload(RUNNER_MODEL_URL, { ...FETCH, fetchPriority: 'high' });
  preload(SKY_FILES.coarse, { ...FETCH, media: COARSE_POINTER_QUERY });
  preload(SKY_FILES.fine, { ...FETCH, media: FINE_POINTER_QUERY });
}
