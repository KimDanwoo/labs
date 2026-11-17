import * as THREE from 'three/webgpu';

import { placedInArea } from './layout/areaPlacement';

export const SHOWER_SCALE = 1.5;

const BAY = { center: placedInArea('toilet', new THREE.Vector3(65.53, 0, 63.55)), radius: 4.2 } as const;

export function pushOutOfShowerBay(position: THREE.Vector3, center: THREE.Vector3 = BAY.center): void {
  const outward = new THREE.Vector3(position.x - center.x, 0, position.z - center.z);
  if (outward.length() >= BAY.radius) return;
  outward.setLength(BAY.radius);
  position.set(center.x + outward.x, position.y, center.z + outward.z);
}
