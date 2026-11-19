import { GATES } from '../../model/exploration/world';
import { terrainHeightAt } from '../scene/terrain';

export const centers = GATES.map((gate) => ({
  x: gate.x,
  y: terrainHeightAt(gate.x, gate.z) + gate.height,
  z: gate.z,
}));
