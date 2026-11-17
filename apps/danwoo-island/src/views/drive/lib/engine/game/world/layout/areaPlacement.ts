import * as THREE from 'three/webgpu';

import { AREA_ANCHORS, type AreaKey } from './islandLayout';

export function areaShift(area: AreaKey): THREE.Vector3 {
  const { original, placed } = AREA_ANCHORS[area];
  return new THREE.Vector3(placed[0] - original[0], 0, placed[1] - original[1]);
}

export function placedInArea(area: AreaKey, point: THREE.Vector3): THREE.Vector3 {
  return point.clone().add(areaShift(area));
}
