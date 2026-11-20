import * as THREE from 'three/webgpu';

import type { Respawns } from '@views/drive/lib/engine/game/respawns';
import { INTRO_RING } from '@views/drive/lib/engine/game/world/layout/islandLayout';

const INTRO_CENTER_OFFSET = new THREE.Vector3(INTRO_RING.offset[0], 0, INTRO_RING.offset[1]);

export function introCenter(respawns: Respawns): THREE.Vector3 {
  return respawns.getDefault().position.clone().add(INTRO_CENTER_OFFSET).setY(0);
}
