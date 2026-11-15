import * as THREE from 'three/webgpu';

import type { Respawns } from './respawns';

const INTRO_CENTER_OFFSET = new THREE.Vector3(0.9, 0, -1.5);

export function introCenter(respawns: Respawns): THREE.Vector3 {
  return respawns.getDefault().position.clone().add(INTRO_CENTER_OFFSET).setY(0);
}
