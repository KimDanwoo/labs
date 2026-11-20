import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { GATES } from '@views/ride/model/exploration/world';

export const centers = GATES.map((gate) => ({
  x: gate.x,
  y: terrainHeightAt(gate.x, gate.z) + gate.height,
  z: gate.z,
}));
