import { COARSE_POINTER_QUERY, FINE_POINTER_QUERY } from '@shared/config/media';
import { SKY_FILES } from '@views/ride/config/scene';
import { RUNNER_MODEL_URL } from '@views/ride/model/runner/constants';
import { preload } from 'react-dom';

const FETCH = { as: 'fetch', crossOrigin: 'anonymous' } as const;

export function preloadSceneAssets(): void {
  preload(RUNNER_MODEL_URL, { ...FETCH, fetchPriority: 'high' });
  preload(SKY_FILES.coarse, { ...FETCH, media: COARSE_POINTER_QUERY });
  preload(SKY_FILES.fine, { ...FETCH, media: FINE_POINTER_QUERY });
}
