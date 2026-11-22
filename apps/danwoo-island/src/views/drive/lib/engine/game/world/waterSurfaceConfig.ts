import * as THREE from 'three/webgpu';

export type Vec4Node = THREE.Node<'vec4'>;
export interface Details {
  hasRipples: boolean;
  hasIce: boolean;
  hasSplashes: boolean;
}
export const ICE_HALF_THICKNESS = 0.5;
export const ICE_HALF_EXTENT = 256;
export const ICE_FRICTION = { melted: 0.5, frozen: 0.02 } as const;
export const ICE_HIDDEN_DEPTH = -1.5;
export const MIN_RATIO = 0.0001;
export const BLUR = { amount: 0.01, repeats: 12 } as const;
export const RIPPLES = { frequency: 7, opacity: 0.6, widest: -0.8 } as const;
export const FOAM_BEADS = { frequency: 0.32, radius: 0.42 } as const;
export const THROTTLE_ORDER = 2;
