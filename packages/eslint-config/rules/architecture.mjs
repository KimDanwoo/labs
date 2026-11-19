import { componentFile, interactiveComposition, routingLocation } from './architecture/componentRules.mjs';
import { dependencies, publicApi, structure } from './architecture/layerRules.mjs';
import { entityState } from './architecture/stateRules.mjs';

export default {
  rules: {
    'slice-structure': structure,
    'public-api': publicApi,
    'independent-slices': dependencies,
    'component-file': componentFile,
    'routing-location': routingLocation,
    'entity-state': entityState,
    'interactive-composition': interactiveComposition,
  },
};
