import * as THREE from 'three/webgpu';

import { LineGeometry } from '@views/drive/lib/engine/game/geometries/lineGeometry';

interface WindLineOptions {
  length?: number;
  handlesCount?: number;
  amplitude?: number;
  divisions?: number;
}

function windLinePoints({
  length = 10,
  handlesCount = 4,
  amplitude = 1,
  divisions = 30,
}: WindLineOptions): THREE.Vector3[] {
  const halfExtent = length / 2;
  const handleSpan = length / (handlesCount - 1);
  const handles = Array.from(
    { length: handlesCount },
    (_, index) => new THREE.Vector3(0, (index % 2) - 0.5 * amplitude, -halfExtent + index * handleSpan),
  );
  return new THREE.CatmullRomCurve3(handles).getPoints(divisions);
}

export class WindLineGeometry extends LineGeometry {
  constructor(options: WindLineOptions = {}) {
    super(windLinePoints(options));
  }
}
