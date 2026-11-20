import * as THREE from 'three/webgpu';

import { AREA_ANCHORS, type AreaKey } from '@views/drive/lib/engine/game/world/layout/islandLayout';

const UP = new THREE.Vector3(0, 1, 0);

function areaRotation(area: AreaKey): number {
  return AREA_ANCHORS[area].rotation ?? 0;
}

export function areaQuaternion(area: AreaKey): THREE.Quaternion {
  return new THREE.Quaternion().setFromAxisAngle(UP, areaRotation(area));
}

export function placedInArea(area: AreaKey, point: THREE.Vector3): THREE.Vector3 {
  const { original, placed } = AREA_ANCHORS[area];
  return point
    .clone()
    .sub(new THREE.Vector3(original[0], 0, original[1]))
    .applyQuaternion(areaQuaternion(area))
    .add(new THREE.Vector3(placed[0], 0, placed[1]));
}
