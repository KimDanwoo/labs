import * as THREE from 'three/webgpu';

import type { InstanceReference } from '@views/drive/lib/engine/game/instancedGroup';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';

interface FanFlight {
  launchedAt: number;
  phase: number;
  heading: number;
  spin: number;
}
export interface Fan {
  reference: InstanceReference;
  object: WorldObject;
  flight: FanFlight | null;
}
export const LINK_MODELS = new Map<string, string>([
  ['GitHub', 'gitHub'],
  ['블로그', 'twitch'],
  ['SoundCloud', 'youtube'],
  ['이력서', 'mail'],
  ['Danwoo Lab', 'x'],
]);
export const LINK_ELEVATION = 1;
export const LINK_FRONT = new THREE.Vector3(0, 0, 1.1);
export const UNLINKED_SIGNS = /^(bluesky|linkedIn|discord)/i;
export const FAN_COUNT = 30;
export const FAN_MASS = 0.02;
export const FAN_HIDDEN_LIFT = 99;
export const FAN_HALF_SIZE: [number, number, number] = [0.45, 0.65, 0.45];
export const FAN_SPREAD = { horizontal: 2, lift: 0.6 } as const;
export const FAN_FLIGHT = { rise: 0.8, spin: 5, lifetime: 9 } as const;
export const FAN_SWAY = { frequency: 1.6, amplitude: 0.9, tilt: 0.8 } as const;
export const RESET_SETTLE_FRAMES = 2;
