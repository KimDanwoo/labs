import { terrainHeightAt } from '../../config/scene';
import { GATES } from '../../model/exploration/world';

export const centers = GATES.map((gate) => ({
  x: gate.x,
  y: terrainHeightAt(gate.x, gate.z) + gate.height,
  z: gate.z,
}));
